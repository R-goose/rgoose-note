package com.rgoose.note.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * 媒体文件元数据实体（文件本体存磁盘）
 */
@Data
@TableName("images")
public class Image {

    @TableId(type = IdType.INPUT)
    private String id;

    private String fileName;

    private String mimeType;

    private Long sizeBytes;

    private String storagePath;

    private Long createdAt;
}
