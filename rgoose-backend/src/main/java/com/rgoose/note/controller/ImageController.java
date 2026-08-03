package com.rgoose.note.controller;

import com.rgoose.note.common.R;
import com.rgoose.note.service.ImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * 媒体图片 Controller
 */
@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;

    /** 上传图片，返回 ref */
    @PostMapping
    public R<Map<String, String>> upload(@RequestParam("file") MultipartFile file) {
        String ref = imageService.upload(file);
        return R.ok(Map.of("ref", ref));
    }

    /** 下载图片（直接返回二进制流，不经过 R 包装） */
    @GetMapping(value = "/{ref}", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<Resource> download(@PathVariable String ref) {
        Resource resource = imageService.download(ref);
        MediaType mediaType = MediaTypeFactory.getMediaType(ref)
                .orElse(MediaType.APPLICATION_OCTET_STREAM);
        return ResponseEntity.ok()
                .contentType(mediaType)
                .body(resource);
    }

    /** 删除图片 */
    @DeleteMapping("/{ref}")
    public R<Void> delete(@PathVariable String ref) {
        imageService.delete(ref);
        return R.ok();
    }

    /** 列出全部图片 ref（用于孤儿清理） */
    @GetMapping
    public R<List<String>> listRefs() {
        return R.ok(imageService.listRefs());
    }
}
