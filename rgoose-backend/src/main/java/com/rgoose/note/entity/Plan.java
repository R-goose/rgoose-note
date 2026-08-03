package com.rgoose.note.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import lombok.Data;

import java.util.List;

/**
 * 计划/待办实体
 */
@Data
@TableName(value = "plans", autoResultMap = true)
public class Plan {

    @TableId(type = IdType.INPUT)
    private String id;

    private String title;

    private String description;

    private Long dueDate;

    /** 提醒配置：前端 reminder 为 any|null，直接以原始 JSON 文本存储，不加 typeHandler */
    private String reminder;

    /** 是否完成（对齐前端 boolean，MyBatis 自动映射 TINYINT<->Boolean） */
    private Boolean completed;

    private String priority;

    /** tagId 数组，JSON 存储 */
    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> tags;

    private String noteId;

    private String blockId;

    private Long createdAt;

    private Long updatedAt;
}
