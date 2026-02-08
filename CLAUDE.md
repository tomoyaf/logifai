# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

logifai は、開発コマンドの出力を自動キャプチャし、Claude Code から検索・分析できる CLI ツール。Node.js/TypeScript で実装する。

**コア機能**: `npm run dev 2>&1 | logifai` でログをパイプキャプチャし、NDJSON 形式で永続保存。Claude Code Skill 経由で AI がログを検索・分析する。

## 技術スタック

- **言語**: TypeScript (Node.js)
- **依存関係**: 最小（標準ライブラリ中心）
- **配布**: Bun compile によるシングルバイナリ + npm パッケージ
- **ストレージ**: NDJSON ファイル（Phase 1）、SQLite FTS5（Phase 3）
- **AI統合**: Claude Code Skill（Phase 1-3）、MCP サーバー（Phase 4）

## ビルド

- **開発用**: `npm run build` (tsc) → `npm test` (node --test)
- **バイナリ**: `npm run build:binary` (Bun compile、ローカルプラットフォーム)
- **全プラットフォーム**: `npm run build:all` (クロスコンパイル)

## 配布

- **プライマリ**: Bun compile によるシングルバイナリ（GitHub Releases で 5 プラットフォーム配布）
- **セカンダリ**: npm パッケージ（`npm i -g logifai`、後方互換）
- **インストーラ**: `install.sh` — OS/アーキテクチャ自動検出、SHA256 検証、PATH 自動設定
- **自動更新**: `logifai update` — GitHub Releases API でバージョンチェック → バイナリダウンロード → SHA256 検証 → 置換
- **CI/CD**: `.github/workflows/release.yml` — `v*` タグで自動ビルド＆リリース

## 主要モジュール

| モジュール | 役割 |
|-----------|------|
| `cli.ts` | CLI エントリポイント、引数パース、コマンドディスパッチ |
| `capture.ts` | パイプキャプチャ（`--no-ui` モード） |
| `live-capture.ts` | ライブキャプチャ（Web UI 連携、SSE） |
| `normalizer.ts` | ログ行の正規化（JSON 検出、レベル推論、スタックトレース検出） |
| `redactor.ts` | 秘密情報の自動マスキング |
| `storage.ts` | NDJSON ファイル書き込み、ディレクトリ管理 |
| `session.ts` | セッション作成、Git 情報取得 |
| `server.ts` | Web UI HTTP サーバー + 埋め込み HTML |
| `api.ts` | REST API エンドポイント |
| `ref.ts` | ログ行参照（`logifai://` URI）の解析と解決 |
| `cleanup.ts` | セッションファイルの保持ポリシー管理 |
| `settings.ts` | 設定ファイルの読み書き |
| `version.ts` | バージョン定数（Bun compile 互換） |
| `update.ts` | 自動更新（GitHub Releases チェック、バイナリダウンロード） |
| `types.ts` | 型定義（`LogEntry`, `SessionInfo`, `CaptureOptions`） |
| `ui-html.ts` | Web UI HTML テンプレート（`server.ts` から import） |
| `index.ts` | パッケージエントリポイント（npm 用 re-export） |

## アーキテクチャ

### 段階的実装（4フェーズ）

- **Phase 1（最小MVP）**: パイプキャプチャ (`logifai`) + NDJSON 保存 + 正規化エンジン + リダクション + Web UI + Claude Code Skill + `show` コマンド + `cleanup` コマンド + 設定管理 + Bun compile シングルバイナリ配布 + `update` コマンド（自動更新）
- **Phase 2**: 子プロセス対応 (`logifai exec`) + TTY伝播 + シグナル転送
- **Phase 3**: SQLite FTS5 インデックス + `.logifai.toml` 設定ファイル + `logifai start`
- **Phase 4**: MCP サーバー + セマンティック検索 + 異常検知

### ストレージ（XDG Base Directory 準拠）

```
~/.local/state/logifai/logs/     # ログ本体（NDJSON）
~/.local/share/logifai/          # SQLite インデックス（Phase 3）
~/.config/logifai/               # 設定ファイル
~/.cache/logifai/                # キャッシュ
```

### NDJSON スキーマ

各ログ行は以下のフィールドを持つ JSON オブジェクト：

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `timestamp` | string | ISO 8601 形式 |
| `level` | string | `ERROR` / `WARN` / `INFO` / `DEBUG` |
| `message` | string | ログメッセージ本文 |
| `source` | string | キャプチャ元コマンド |
| `project` | string | プロジェクトパス |
| `session_id` | string | セッション識別子（UUID 先頭8文字） |
| `git_branch` | string\|null | Git ブランチ |
| `git_commit` | string\|null | Git コミットハッシュ（短縮形） |
| `pid` | number | プロセス ID |
| `raw` | boolean | 非構造化ログの場合 `true` |
| `stack` | string\|null | スタックトレース |
| `_original` | object\|null | 元の JSON フィールド（JSON 入力の場合） |

> `_line`（1-based 物理行番号）は NDJSON ファイルには保存されないが、API レスポンス・`show` コマンド・Web UI でランタイム付与される。

### 正規化エンジン

stdin を1行ずつ処理し、JSON 自動検出 → 非構造化ログのレベル推論（ERROR/WARN/INFO/DEBUG）→ スタックトレース検出 → 共通フォーマット（CLF, Syslog）パースを行い、統一 NDJSON スキーマで保存する。

### セキュリティ

ログに混入する秘密情報（API キー、トークン、DB 接続文字列等）を正規表現パターンで自動リダクション。ファイルパーミッション 700/600。デフォルトでローカルオンリー。

## 設計ドキュメント

詳細な技術仕様・競合分析・ロードマップは `doc.md` を参照。
