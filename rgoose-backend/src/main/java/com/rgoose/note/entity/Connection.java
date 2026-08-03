package com.rgoose.note.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * 块间连线实体
 * from / to 是 MySQL 保留字，必须反引号包裹
 */
@Data
@TableName("connections")
public class Connection {

    @TableId(type = IdType.INPUT)
    private String id;

    private String noteId;

    /** 起始 blockId（MySQL 保留字，反引号包裹） */
    @TableField(value = "`from`")
    private String from;

    /** 目标 blockId（MySQL 保留字，反引号包裹） */
    @TableField(value = "`to`")
    private String to;

    private String shape;

    private String dash;

    private String arrow;

    private String dir;

    private String color;

    private String width;

    private String label;

    private Long createdAt;
}
