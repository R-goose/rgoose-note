package com.rgoose.note.common;

import lombok.Getter;

/**
 * 自定义业务异常
 * 携带业务状态码 code 与提示信息 msg
 */
@Getter
public class BizException extends RuntimeException {

    private final int code;

    public BizException(int code, String msg) {
        super(msg);
        this.code = code;
    }

    public BizException(String msg) {
        this(500, msg);
    }

    /** 资源不存在 (404) */
    public static BizException notFound(String msg) {
        return new BizException(404, msg);
    }

    /** 数据冲突 (409) */
    public static BizException conflict(String msg) {
        return new BizException(409, msg);
    }

    /** 参数错误 (400) */
    public static BizException badRequest(String msg) {
        return new BizException(400, msg);
    }
}
