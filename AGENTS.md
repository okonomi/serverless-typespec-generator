# Agent Guidelines

## プロジェクト概要

- **Serverless TypeSpec Generator** は Serverless Framework 用のプラグインです。
- `serverless.yml` の設定から TypeSpec 設定ファイル (`main.tsp`, `tspconfig.yaml`) を生成します。
- モノレポ構成で `pnpm` を使用しています。

## 開発手順

1. Node.js (18 以上) と pnpm を用意します。
2. 依存関係をインストールします。
   ```bash
   pnpm install --ignore-scripts
   ```
3. ビルド
   ```bash
   pnpm -F serverless-typespec-generator build
   ```
4. テスト実行
   ```bash
   pnpm test
   ```
   追加の統合テストは `tests/run.sh` を利用します。
5. Lint
   ```bash
   pnpm lint
   ```

## ディレクトリ構成

```
.
├── examples/    # サンプルプロジェクト
├── packages/    # プラグイン本体
├── tests/       # テスト用スクリプトと yml
└── ...
```

- プラグインソース: `packages/serverless-typespec-generator/`
- サンプル: `examples/with-sls-v3` など
- テスト: `tests/`

## ブランチの作成ルール

- ブランチ名には次の文字のみを使用してください。
  - 英語のアルファベット (`a` から `z`、`A` から `Z`)
  - 数字 (`0` から `9`)
  - ピリオド (`.`)
  - ハイフン (`-`)
  - アンダースコア (`_`)
  - スラッシュ (`/`)

## 備考

- `README.md` に基本的な使い方の例が記載されています。
- `Vitest` を使用したユニットテストが `packages/serverless-typespec-generator` にあります。
