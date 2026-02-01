#!/bin/bash

# Git 分支恢復輔助腳本
# 用於協助恢復誤刪的 Git 分支

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 顯示標題
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    Git 分支恢復輔助工具${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 檢查是否在 Git 倉庫中
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}錯誤：當前目錄不是 Git 倉庫${NC}"
    exit 1
fi

# 顯示功能選單
echo -e "${GREEN}請選擇您要執行的操作：${NC}"
echo "1. 查看最近的分支操作（推薦）"
echo "2. 查看完整的 reflog"
echo "3. 搜尋特定分支名稱"
echo "4. 查看所有懸空的提交"
echo "5. 手動輸入提交 hash 恢復分支"
echo "6. 從遠端恢復分支"
echo ""
read -p "請輸入選項 (1-6): " choice
echo ""

case $choice in
    1)
        echo -e "${YELLOW}顯示最近 30 條 reflog 記錄...${NC}"
        echo ""
        git reflog --date=relative -30
        echo ""
        echo -e "${GREEN}請找到您要恢復的分支的最後一次操作${NC}"
        echo -e "通常會顯示類似 'checkout: moving from ${YELLOW}分支名${NC} to ...' 的記錄"
        echo ""
        read -p "請輸入該分支最後一次提交的引用（例如 HEAD@{5}）: " ref
        read -p "請輸入要恢復的分支名稱: " branch_name
        
        if [ -z "$ref" ] || [ -z "$branch_name" ]; then
            echo -e "${RED}錯誤：引用和分支名稱不能為空${NC}"
            exit 1
        fi
        
        echo ""
        echo -e "${YELLOW}正在恢復分支 '${branch_name}' 從引用 '${ref}'...${NC}"
        
        if git branch "$branch_name" "$ref"; then
            echo -e "${GREEN}✓ 成功恢復分支 '${branch_name}'${NC}"
            echo ""
            echo "您現在可以切換到該分支："
            echo -e "  ${BLUE}git checkout ${branch_name}${NC}"
        else
            echo -e "${RED}✗ 恢復失敗，請檢查引用是否正確${NC}"
            exit 1
        fi
        ;;
    
    2)
        echo -e "${YELLOW}顯示完整 reflog...${NC}"
        echo ""
        git reflog --date=iso
        echo ""
        echo -e "${GREEN}您可以使用上面的資訊來找到要恢復的分支${NC}"
        echo "使用選項 1 或 5 來恢復分支"
        ;;
    
    3)
        read -p "請輸入要搜尋的分支名稱（或部分名稱）: " search_term
        
        if [ -z "$search_term" ]; then
            echo -e "${RED}錯誤：搜尋詞不能為空${NC}"
            exit 1
        fi
        
        echo ""
        echo -e "${YELLOW}搜尋包含 '${search_term}' 的 reflog 記錄...${NC}"
        echo ""
        
        if git reflog | grep -i "$search_term"; then
            echo ""
            echo -e "${GREEN}找到相關記錄${NC}"
            echo ""
            read -p "是否要恢復分支？(y/n): " confirm
            
            if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
                read -p "請輸入該分支最後一次提交的引用（例如 HEAD@{5} 或提交 hash）: " ref
                read -p "請輸入要恢復的分支名稱: " branch_name
                
                if [ -z "$ref" ] || [ -z "$branch_name" ]; then
                    echo -e "${RED}錯誤：引用和分支名稱不能為空${NC}"
                    exit 1
                fi
                
                echo ""
                echo -e "${YELLOW}正在恢復分支 '${branch_name}' 從引用 '${ref}'...${NC}"
                
                if git branch "$branch_name" "$ref"; then
                    echo -e "${GREEN}✓ 成功恢復分支 '${branch_name}'${NC}"
                    echo ""
                    echo "您現在可以切換到該分支："
                    echo -e "  ${BLUE}git checkout ${branch_name}${NC}"
                else
                    echo -e "${RED}✗ 恢復失敗，請檢查引用是否正確${NC}"
                    exit 1
                fi
            fi
        else
            echo -e "${RED}未找到包含 '${search_term}' 的記錄${NC}"
        fi
        ;;
    
    4)
        echo -e "${YELLOW}查找所有懸空的提交...${NC}"
        echo ""
        git fsck --lost-found --no-reflogs | grep "dangling commit"
        echo ""
        echo -e "${GREEN}以上是所有懸空的提交${NC}"
        echo "您可以使用以下命令查看提交的詳細資訊："
        echo -e "  ${BLUE}git show <提交-hash>${NC}"
        echo ""
        echo "確認是您要的提交後，可以使用選項 5 來恢復分支"
        ;;
    
    5)
        read -p "請輸入提交 hash 或引用（例如 abc123 或 HEAD@{5}）: " ref
        read -p "請輸入要創建的分支名稱: " branch_name
        
        if [ -z "$ref" ] || [ -z "$branch_name" ]; then
            echo -e "${RED}錯誤：引用和分支名稱不能為空${NC}"
            exit 1
        fi
        
        echo ""
        echo -e "${YELLOW}正在創建分支 '${branch_name}' 從引用 '${ref}'...${NC}"
        
        if git branch "$branch_name" "$ref"; then
            echo -e "${GREEN}✓ 成功創建分支 '${branch_name}'${NC}"
            echo ""
            echo "您現在可以切換到該分支："
            echo -e "  ${BLUE}git checkout ${branch_name}${NC}"
            echo ""
            echo "驗證分支內容："
            echo -e "  ${BLUE}git log ${branch_name} --oneline -10${NC}"
        else
            echo -e "${RED}✗ 創建失敗，請檢查引用是否正確${NC}"
            exit 1
        fi
        ;;
    
    6)
        echo -e "${YELLOW}獲取遠端分支列表...${NC}"
        echo ""
        git fetch --all
        echo ""
        git branch -r
        echo ""
        read -p "請輸入要恢復的遠端分支名稱（例如 origin/feature-branch）: " remote_branch
        
        if [ -z "$remote_branch" ]; then
            echo -e "${RED}錯誤：遠端分支名稱不能為空${NC}"
            exit 1
        fi
        
        # 提取分支名稱（去掉 origin/ 前綴）
        local_branch=$(echo "$remote_branch" | sed 's|^origin/||')
        
        read -p "本地分支名稱 [${local_branch}]: " custom_name
        
        if [ -n "$custom_name" ]; then
            local_branch="$custom_name"
        fi
        
        echo ""
        echo -e "${YELLOW}正在從 '${remote_branch}' 恢復為本地分支 '${local_branch}'...${NC}"
        
        if git checkout -b "$local_branch" "$remote_branch"; then
            echo -e "${GREEN}✓ 成功從遠端恢復分支 '${local_branch}'${NC}"
        else
            echo -e "${RED}✗ 恢復失敗，請檢查遠端分支是否存在${NC}"
            exit 1
        fi
        ;;
    
    *)
        echo -e "${RED}無效的選項${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}操作完成！${NC}"
echo ""
echo "更多資訊請參考："
echo -e "  ${BLUE}docs/GIT_BRANCH_RECOVERY.md${NC}"
echo -e "${BLUE}========================================${NC}"
