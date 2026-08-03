package com.rgoose.note.controller;

import com.rgoose.note.common.R;
import com.rgoose.note.entity.Folder;
import com.rgoose.note.service.FolderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 文件夹 Controller
 */
@RestController
@RequestMapping("/api/folders")
@RequiredArgsConstructor
public class FolderController {

    private final FolderService folderService;

    /** 文件夹列表（按 parentId 过滤） */
    @GetMapping
    public R<List<Folder>> list(@RequestParam(required = false) String parentId) {
        return R.ok(folderService.list(parentId));
    }

    /** 文件夹详情 */
    @GetMapping("/{id}")
    public R<Folder> get(@PathVariable String id) {
        return R.ok(folderService.get(id));
    }

    /** 新建文件夹 */
    @PostMapping
    public R<Folder> create(@RequestBody Folder folder) {
        return R.ok(folderService.create(folder));
    }

    /** 更新文件夹 */
    @PutMapping("/{id}")
    public R<Folder> update(@PathVariable String id, @RequestBody Folder folder) {
        return R.ok(folderService.update(id, folder));
    }

    /** 删除文件夹（递归软删，返回受影响计数） */
    @DeleteMapping("/{id}")
    public R<Integer> delete(@PathVariable String id) {
        return R.ok(folderService.delete(id));
    }
}
