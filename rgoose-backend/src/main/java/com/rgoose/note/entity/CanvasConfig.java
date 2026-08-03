package com.rgoose.note.entity;

import lombok.Data;

import java.io.Serializable;

/**
 * 画布配置（嵌入 Note.canvasConfig）
 * 对齐前端 { zoom, offsetX, offsetY }
 */
@Data
public class CanvasConfig implements Serializable {

    private static final long serialVersionUID = 1L;

    /** 缩放比例 */
    private Double zoom;

    /** 画布横向偏移 */
    private Double offsetX;

    /** 画布纵向偏移 */
    private Double offsetY;
}
