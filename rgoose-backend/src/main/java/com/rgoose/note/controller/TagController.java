package com.rgoose.note.controller;

import com.rgoose.note.common.R;
import com.rgoose.note.entity.Tag;
import com.rgoose.note.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 标签 Controller
 */
@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    /** 标签列表 */
    @GetMapping
    public R<List<Tag>> list() {
        return R.ok(tagService.list());
    }

    /** 标签详情 */
    @GetMapping("/{id}")
    public R<Tag> get(@PathVariable String id) {
        return R.ok(tagService.get(id));
    }

    /** 新建标签 */
    @PostMapping
    public R<Tag> create(@RequestBody Tag tag) {
        return R.ok(tagService.create(tag));
    }

    /** 更新标签 */
    @PutMapping("/{id}")
    public R<Tag> update(@PathVariable String id, @RequestBody Tag tag) {
        return R.ok(tagService.update(id, tag));
    }

    /** 删除标签 */
    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable String id) {
        tagService.delete(id);
        return R.ok();
    }
}
