# Git 分支恢復指南

## 問題：不小心刪除了分支怎麼辦？

如果您不小心刪除了 Git 分支，不用擔心！Git 提供了強大的 reflog 功能，可以讓您找回誤刪的分支。

## 快速恢復步驟

### 方法一：使用提供的恢復腳本（推薦）

我們提供了一個便捷的腳本來幫助您恢復分支：

```bash
# 執行恢復腳本
bash scripts/recover-branch.sh
```

腳本會自動顯示最近刪除的分支，並引導您完成恢復流程。

### 方法二：手動使用 Git 命令

#### 步驟 1：查看 reflog

```bash
git reflog
```

這會顯示所有最近的 Git 操作歷史，找到刪除分支前的最後一次提交。

#### 步驟 2：找到被刪除分支的最後提交

在 reflog 輸出中，尋找類似以下的記錄：

```
abc1234 HEAD@{1}: checkout: moving from deleted-branch to main
def5678 HEAD@{2}: commit: Last commit on deleted branch
```

其中 `def5678` 就是被刪除分支的最後一次提交的 hash。

#### 步驟 3：恢復分支

使用找到的提交 hash 重新創建分支：

```bash
git branch <分支名稱> <提交-hash>
```

例如：

```bash
git branch recovered-branch def5678
```

#### 步驟 4：切換到恢復的分支

```bash
git checkout recovered-branch
```

## 常見場景

### 場景 1：剛剛刪除的分支

如果您剛剛刪除了分支（幾分鐘或幾小時內）：

```bash
# 查看最近的分支操作
git reflog --date=relative

# 找到刪除操作，通常顯示為 "Branch: deleting refs/heads/分支名"
# 恢復到刪除前的狀態
git branch <分支名稱> HEAD@{n}
```

### 場景 2：知道分支名稱但不記得提交 hash

```bash
# 搜尋特定分支名稱的記錄
git reflog | grep "分支名稱"

# 使用找到的引用恢復
git branch <分支名稱> <引用>
```

### 場景 3：透過提交訊息尋找

```bash
# 查看所有可達的提交
git fsck --lost-found

# 查看懸空提交的詳細資訊
git log --all --oneline | grep "關鍵字"

# 恢復分支
git branch <分支名稱> <提交-hash>
```

## 預防措施

為避免未來再次發生誤刪分支的情況，建議採取以下措施：

### 1. 使用 Git Alias 進行安全刪除

在 `.gitconfig` 中添加：

```bash
[alias]
    delete-branch = "!f() { \
        echo \"Are you sure you want to delete branch $1? (y/n)\"; \
        read ans; \
        if [ \"$ans\" = \"y\" ]; then \
            git branch -d $1; \
        else \
            echo \"Branch deletion cancelled.\"; \
        fi; \
    }; f"
```

使用方式：

```bash
git delete-branch <分支名稱>
```

### 2. 定期備份重要分支

```bash
# 創建備份標籤
git tag backup/<分支名稱> <分支名稱>

# 推送標籤到遠端
git push origin backup/<分支名稱>
```

### 3. 使用受保護分支

在 GitHub/GitLab 等平台上，將重要分支設置為受保護分支，防止意外刪除。

### 4. 在刪除前推送到遠端

```bash
# 推送分支到遠端
git push origin <分支名稱>

# 即使本地刪除，仍可從遠端恢復
git fetch origin
git checkout -b <分支名稱> origin/<分支名稱>
```

## 高級技巧

### 查看特定時間範圍的 reflog

```bash
# 查看最近 7 天的 reflog
git reflog --since="7 days ago"

# 查看特定日期之後的 reflog
git reflog --since="2024-01-01"
```

### 恢復多個分支

如果同時刪除了多個分支，可以使用腳本批量恢復：

```bash
# 列出所有懸空的提交
git fsck --unreachable --no-reflogs | grep commit

# 對每個提交創建臨時分支檢查
git branch temp-<編號> <提交-hash>
```

## 重要提醒

⚠️ **注意事項：**

1. **時效性**：reflog 通常保留 90 天，超過此期限的記錄可能無法恢復
2. **垃圾回收**：運行 `git gc` 後，某些未引用的提交可能被清理
3. **本地操作**：reflog 是本地記錄，不會同步到遠端
4. **及時恢復**：發現誤刪後應盡快恢復，避免記錄被覆蓋

## 相關指令參考

| 指令 | 說明 |
|------|------|
| `git reflog` | 顯示引用日誌 |
| `git reflog show <分支名>` | 顯示特定分支的 reflog |
| `git fsck --lost-found` | 尋找所有懸空的對象 |
| `git branch <名稱> <提交>` | 從提交創建新分支 |
| `git log --all --oneline` | 查看所有提交歷史 |

## 需要幫助？

如果以上方法都無法恢復您的分支，請：

1. 檢查是否在團隊成員的本地倉庫中還有該分支
2. 查看 CI/CD 系統是否保留了該分支的備份
3. 聯繫您的團隊領導或 Git 管理員尋求協助

## 參考資源

- [Git 官方文檔 - git-reflog](https://git-scm.com/docs/git-reflog)
- [Git 官方文檔 - git-fsck](https://git-scm.com/docs/git-fsck)
- [Atlassian Git 教程 - 撤銷更改](https://www.atlassian.com/git/tutorials/undoing-changes)
