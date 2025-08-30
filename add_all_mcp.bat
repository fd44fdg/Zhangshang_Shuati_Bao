@echo off
chcp 65001 >nul
echo 正在批量添加 MCP 服务器到当前项目配置...
echo.

setlocal enabledelayedexpansion

set servers=^
context7 npx @upstash/context7-mcp;^
spec-workflow npx spec-workflow-mcp@latest;^
grep mcp-grep-server;^
taskmaster-ai npx --package=task-master-ai task-master-ai;^
sequential-thinking npx @modelcontextprotocol/server-sequential-thinking;^
github npx @modelcontextprotocol/server-github;^
filesystem npx @modelcontextprotocol/server-filesystem;^
search-index npx @mtorange/mcp-local-file-search mcp --dir .;^
database-mcp npx @executeautomation/database-server %MCP_DB_PATH%;^
spreadsheet-mcp npx @zephyr-mcp/spreadsheet;^
git uvx mcp-server-git --repository ./;^
qdrant uv run --directory C:/Users/DsayROWE/mcp-server-qdrant mcp-server-qdrant;^
browserTools npx @agentdeskai/browser-tools-mcp@latest

for %%S in (%servers%) do (
    for /f "tokens=1*" %%a in ("%%S") do (
        echo 正在添加: %%a
        claude mcp add %%S
    )
)

echo.
echo 所有 MCP 添加命令已执行完毕。
pause
