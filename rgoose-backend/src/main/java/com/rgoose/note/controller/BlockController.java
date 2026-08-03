package com.rgoose.note.controller;

import com.rgoose.note.common.R;
import com.rgoose.note.entity.Block;
import com.rgoose.note.service.BlockService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 画布块 Controller（嵌套在笔记下）
 */
@RestController
@RequestMapping("/api/notes/{noteId}/blocks")
@RequiredArgsConstructor
public class BlockController {

    private final BlockService blockService;

    /** 块列表 */
    @GetMapping
    public R<List<Block>> list(@PathVariable String noteId) {
        return R.ok(blockService.list(noteId));
    }

    /** 新建块 */
    @PostMapping
    public R<Block> create(@PathVariable String noteId, @RequestBody Block block) {
        return R.ok(blockService.create(noteId, block));
    }

    /** 更新块 */
    @PutMapping("/{blockId}")
    public R<Block> update(@PathVariable String noteId,
                           @PathVariable String blockId,
                           @RequestBody Block block) {
        return R.ok(blockService.update(noteId, blockId, block));
    }

    /** 删除块 */
    @DeleteMapping("/{blockId}")
    public R<Void> delete(@PathVariable String noteId, @PathVariable String blockId) {
        blockService.delete(noteId, blockId);
        return R.ok();
    }

    /** 批量更新块（拖拽多块时用） */
    @PostMapping("/batch")
    public R<Void> batchUpdate(@PathVariable String noteId, @RequestBody List<Block> blocks) {
        blockService.batchUpdate(noteId, blocks);
        return R.ok();
    }
}
