package com.rgoose.note.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import lombok.Data;

import java.util.List;

/**
 * 笔记实体
 * 字段名与前端 Note interface 1:1 对齐
 */
@Data
@TableName(value = "notes", autoResultMap = true)
public class Note {

    @TableId(type = IdType.INPUT)
    private String id;

    private String title;

    private String folderId;

    /** tagId 数组，JSON 存储 */
    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> tags;

    /** 画布配置 {zoom,offsetX,offsetY}，JSON 存储 */
    @TableField(typeHandler = JacksonTypeHandler.class)
    private CanvasConfig canvasConfig;

    private Long createdAt;

    private Long updatedAt;

    @TableLogic
    private Boolean deleted;
}
