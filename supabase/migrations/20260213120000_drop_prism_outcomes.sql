-- 移除「现有成果」模块：论文库项目不再使用 outcomes 表
drop table if exists public.prism_outcome_papers;
drop table if exists public.prism_project_outcomes;
