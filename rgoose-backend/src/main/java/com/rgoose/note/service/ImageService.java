package com.rgoose.note.service;

import com.rgoose.note.common.BizException;
import com.rgoose.note.entity.Image;
import com.rgoose.note.mapper.ImageMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 媒体文件业务逻辑：磁盘文件 + 元数据表
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ImageService {

    private final ImageMapper imageMapper;

    @Value("${app.storage.dir:./storage}")
    private String storageDir;

    /** 图片扩展名白名单 */
    private static final Set<String> IMAGE_EXTS = Set.of("png", "jpg", "jpeg", "gif", "webp", "bmp");
    /** 音视频扩展名白名单 */
    private static final Set<String> MEDIA_EXTS = Set.of("mp3", "wav", "mp4", "webm");
    /** 全部允许的扩展名 */
    private static final Set<String> ALLOWED_EXTS;
    static {
        Set<String> s = new HashSet<>();
        s.addAll(IMAGE_EXTS);
        s.addAll(MEDIA_EXTS);
        ALLOWED_EXTS = Collections.unmodifiableSet(s);
    }

    /**
     * 上传文件，返回 ref 字符串（img_xxx 或 media_xxx）
     */
    public String upload(MultipartFile file) {
        try {
            String originalName = file.getOriginalFilename();
            String mimeType = file.getContentType();
            return saveBytes(file.getBytes(), mimeType, originalName);
        } catch (IOException e) {
            log.error("上传文件失败", e);
            throw new BizException(50001, "文件上传失败");
        }
    }

    /**
     * 下载文件，返回 Resource
     */
    public Resource download(String ref) {
        Image image = imageMapper.selectById(ref);
        if (image == null) {
            throw BizException.notFound("文件不存在");
        }
        FileSystemResource resource = new FileSystemResource(
                Paths.get(storageDir, image.getStoragePath()));
        if (!resource.exists()) {
            throw BizException.notFound("文件不存在");
        }
        return resource;
    }

    /**
     * 删除文件 + 元数据
     */
    public void delete(String ref) {
        Image image = imageMapper.selectById(ref);
        if (image == null) {
            return;
        }
        try {
            Files.deleteIfExists(Paths.get(storageDir, image.getStoragePath()));
        } catch (IOException e) {
            log.warn("删除文件失败: {}", ref, e);
        }
        imageMapper.deleteById(ref);
    }

    /**
     * 列出全部 ref（用于孤儿清理）
     */
    public List<String> listRefs() {
        return imageMapper.selectList(null).stream()
                .map(Image::getId)
                .toList();
    }

    /**
     * 从 base64 dataUrl 保存图片（导入场景），返回 ref
     */
    public String saveFromDataUrl(String dataUrl, String fileName) {
        // dataUrl 格式: data:image/png;base64,iVBORw0KGgo...
        int commaIdx = dataUrl.indexOf(',');
        if (commaIdx < 0) {
            throw new BizException(40001, "无效的 dataUrl");
        }
        String meta = dataUrl.substring(0, commaIdx);   // data:image/png;base64
        String base64 = dataUrl.substring(commaIdx + 1);
        // 提取 MIME
        String mimeType;
        int semicolon = meta.indexOf(';');
        mimeType = semicolon > 0 ? meta.substring(5, semicolon) : meta.substring(5);
        byte[] data = Base64.getDecoder().decode(base64);
        try {
            return saveBytes(data, mimeType, fileName);
        } catch (IOException e) {
            log.error("保存 dataUrl 文件失败", e);
            throw new BizException(50001, "文件保存失败");
        }
    }

    /**
     * 保存字节数据到磁盘并写入元数据
     */
    private String saveBytes(byte[] data, String mimeType, String originalName) throws IOException {
        String ref = generateRef(mimeType, originalName);
        Path dir = Paths.get(storageDir, "images");
        Files.createDirectories(dir);
        Files.write(dir.resolve(ref), data);

        Image image = new Image();
        image.setId(ref);
        image.setFileName(ref);
        image.setMimeType(mimeType);
        image.setSizeBytes((long) data.length);
        image.setStoragePath("images/" + ref);
        image.setCreatedAt(System.currentTimeMillis());
        imageMapper.insert(image);
        return ref;
    }

    /**
     * 根据 MIME 与原始文件名生成 ref（img_ 或 media_ 前缀）
     */
    private String generateRef(String mimeType, String originalName) {
        String ext = extractExtension(originalName, mimeType);
        if (!ALLOWED_EXTS.contains(ext)) {
            throw new BizException(40001, "不支持的文件类型: " + ext);
        }
        long ts = System.currentTimeMillis();
        String rand = String.format("%06d", ThreadLocalRandom.current().nextInt(1000000));
        String prefix = IMAGE_EXTS.contains(ext) ? "img_" : "media_";
        return prefix + ts + "_" + rand + "." + ext;
    }

    /**
     * 从原始文件名提取扩展名，回退到 MIME 推断
     */
    private String extractExtension(String originalName, String mimeType) {
        if (originalName != null && originalName.contains(".")) {
            String ext = originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase();
            if (ALLOWED_EXTS.contains(ext)) {
                return ext;
            }
        }
        if (mimeType == null) {
            return "";
        }
        return switch (mimeType) {
            case "image/png" -> "png";
            case "image/jpeg" -> "jpg";
            case "image/gif" -> "gif";
            case "image/webp" -> "webp";
            case "image/bmp" -> "bmp";
            case "audio/mpeg", "audio/mp3" -> "mp3";
            case "audio/wav", "audio/x-wav" -> "wav";
            case "video/mp4" -> "mp4";
            case "video/webm" -> "webm";
            default -> "";
        };
    }
}
