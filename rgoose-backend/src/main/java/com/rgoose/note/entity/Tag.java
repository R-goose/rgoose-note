package com.rgoose.note.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * 标签实体
 */
@Data
@TableName("tags")
public class Tag {

    @TableId(type = IdType.INPUT)
    private String id;

    private String name;

    private String color;

    private Integer sort;

    private Long createdAt;

    private Long updatedAt;
}
