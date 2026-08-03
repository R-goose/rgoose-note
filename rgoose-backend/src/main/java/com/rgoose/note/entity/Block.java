package com.rgoose.note.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import lombok.Data;

import java.util.List;

/**
 * 画布块实体（全字段扁平，对齐前端 Block）
 * text/todo/image/audio/video/gallery 共用一张表，按 type 使用
 */
@Data
@TableName(value = "blocks", autoResultMap = true)
public class Block {

    @TableId(type = IdType.INPUT)
    private String id;

    private String noteId;

    private String type;

    private String content;

    private Double x;

    private Double y;

    private Integer width;

    private Integer minHeight;

    private String color;

    // —— todo 特有 ——
    private String title;

    private String status;

    private String priority;

    private Long dueDate;

    // —— image 特有 ——
    private String imageUrl;

    // —— audio/video 特有 ——
    private String mediaUrl;

    private String mediaName;

    // —— gallery 特有 ——
    /** 图片引用数组 [img_xxx, ...]，JSON 存储 */
    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> images;

    private String galleryLayout;

    // —— 通用 ——
    private Long createdAt;

    private Long updatedAt;
}
