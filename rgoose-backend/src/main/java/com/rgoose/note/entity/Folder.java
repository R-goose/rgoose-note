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
 * 文件夹实体
 * 字段名与前端 camelCase 1:1 对齐
 */
@Data
@TableName(value = "folders", autoResultMap = true)
public class Folder {

    @TableId(type = IdType.INPUT)
    private String id;

    private String name;

    private String parentId;

    /** tagId 数组，JSON 存储 */
    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> tags;

    private Integer isSystem;

    private Long createdAt;

    private Long updatedAt;

    @TableLogic
    private Boolean deleted;
}
