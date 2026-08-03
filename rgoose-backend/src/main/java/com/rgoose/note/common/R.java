package com.rgoose.note.common;

import lombok.Data;

/**
 * 统一响应体
 * 结构: { code, msg, data }
 * 约定: code = 0 表示成功，非 0 表示错误
 */
@Data
public class R<T> {

    /** 业务状态码：0 成功，非 0 失败 */
    private int code;

    /** 提示信息 */
    private String msg;

    /** 业务数据 */
    private T data;

    public static <T> R<T> ok() {
        return ok(null);
    }

    public static <T> R<T> ok(T data) {
        R<T> r = new R<>();
        r.setCode(0);
        r.setMsg("success");
        r.setData(data);
        return r;
    }

    public static <T> R<T> fail(int code, String msg) {
        R<T> r = new R<>();
        r.setCode(code);
        r.setMsg(msg);
        return r;
    }

    public static <T> R<T> fail(BizException e) {
        return fail(e.getCode(), e.getMsg());
    }
}
