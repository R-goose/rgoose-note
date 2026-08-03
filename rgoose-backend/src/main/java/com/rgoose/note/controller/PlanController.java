package com.rgoose.note.controller;

import com.rgoose.note.common.R;
import com.rgoose.note.entity.Plan;
import com.rgoose.note.service.PlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 计划/待办 Controller
 */
@RestController
@RequestMapping("/api/plans")
@RequiredArgsConstructor
public class PlanController {

    private final PlanService planService;

    /** 计划列表（支持 completed / dueBefore / dueAfter 过滤） */
    @GetMapping
    public R<List<Plan>> list(@RequestParam(required = false) Boolean completed,
                              @RequestParam(required = false) Long dueBefore,
                              @RequestParam(required = false) Long dueAfter) {
        return R.ok(planService.list(completed, dueBefore, dueAfter));
    }

    /** 计划详情 */
    @GetMapping("/{id}")
    public R<Plan> get(@PathVariable String id) {
        return R.ok(planService.get(id));
    }

    /** 新建计划 */
    @PostMapping
    public R<Plan> create(@RequestBody Plan plan) {
        return R.ok(planService.create(plan));
    }

    /** 更新计划 */
    @PutMapping("/{id}")
    public R<Plan> update(@PathVariable String id, @RequestBody Plan plan) {
        return R.ok(planService.update(id, plan));
    }

    /** 删除计划 */
    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable String id) {
        planService.delete(id);
        return R.ok();
    }

    /** 切换完成状态 */
    @PatchMapping("/{id}/complete")
    public R<Void> toggleComplete(@PathVariable String id) {
        planService.toggleComplete(id);
        return R.ok();
    }

    /** 全部计划列表（同步用） */
    @GetMapping("/all")
    public R<List<Plan>> listAll() {
        return R.ok(planService.listAll());
    }
}
