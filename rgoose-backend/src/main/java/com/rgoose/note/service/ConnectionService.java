package com.rgoose.note.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.rgoose.note.entity.Block;
import com.rgoose.note.entity.Connection;
import com.rgoose.note.mapper.BlockMapper;
import com.rgoose.note.mapper.ConnectionMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * 连线业务逻辑：新建时双向去重
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ConnectionService {

    private final ConnectionMapper connectionMapper;
    private final BlockMapper blockMapper;

    /**
     * 查询指定笔记的全部连线
     */
    public List<Connection> list(String noteId) {
        return connectionMapper.selectList(
                new LambdaQueryWrapper<Connection>().eq(Connection::getNoteId, noteId));
    }

    /**
     * 新建连线。去重校验：(from,to) 与 (to,from) 视为同一连线，
     * 已存在则返回已有记录而不新建
     */
    public Connection create(String noteId, Connection conn) {
        conn.setNoteId(noteId);
        String from = conn.getFrom();
        String to = conn.getTo();
        // 双向去重查询
        Connection existing = connectionMapper.selectOne(new LambdaQueryWrapper<Connection>()
                .eq(Connection::getNoteId, noteId)
                .and(w -> w
                        .eq(Connection::getFrom, from).eq(Connection::getTo, to)
                        .or()
                        .eq(Connection::getFrom, to).eq(Connection::getTo, from)));
        if (existing != null) {
            return existing;
        }
        // 尊重前端传入的 id，未传时后端生成
        if (conn.getId() == null || conn.getId().isEmpty()) {
            conn.setId(UUID.randomUUID().toString());
        }
        conn.setCreatedAt(System.currentTimeMillis());
        connectionMapper.insert(conn);
        return conn;
    }

    /**
     * 更新连线
     */
    public Connection update(String noteId, String connId, Connection conn) {
        conn.setId(connId);
        connectionMapper.updateById(conn);
        return conn;
    }

    /**
     * 删除连线
     */
    public void delete(String noteId, String connId) {
        connectionMapper.deleteById(connId);
    }
}
