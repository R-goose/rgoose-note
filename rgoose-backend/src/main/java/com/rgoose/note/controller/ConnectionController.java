package com.rgoose.note.controller;

import com.rgoose.note.common.R;
import com.rgoose.note.entity.Connection;
import com.rgoose.note.service.ConnectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 连线 Controller（嵌套在笔记下）
 */
@RestController
@RequestMapping("/api/notes/{noteId}/connections")
@RequiredArgsConstructor
public class ConnectionController {

    private final ConnectionService connectionService;

    /** 连线列表 */
    @GetMapping
    public R<List<Connection>> list(@PathVariable String noteId) {
        return R.ok(connectionService.list(noteId));
    }

    /** 新建连线 */
    @PostMapping
    public R<Connection> create(@PathVariable String noteId, @RequestBody Connection conn) {
        return R.ok(connectionService.create(noteId, conn));
    }

    /** 更新连线 */
    @PutMapping("/{connId}")
    public R<Connection> update(@PathVariable String noteId,
                                @PathVariable String connId,
                                @RequestBody Connection conn) {
        return R.ok(connectionService.update(noteId, connId, conn));
    }

    /** 删除连线 */
    @DeleteMapping("/{connId}")
    public R<Void> delete(@PathVariable String noteId, @PathVariable String connId) {
        connectionService.delete(noteId, connId);
        return R.ok();
    }
}
