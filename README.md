# ALL NIGHT SONGS

> ゑうたん歌リスト — リスナーが今夜の1曲を見つけるサイト

## 概要

Pococha 配信者**ゑうたん**のリスナー向け非公式ファンサイトです。  
3問の気分アンケートに答えると、156曲のレパートリーからぴったりの曲を提案します。

**一ファンによる非公式サイトです。ゑうたん公式ではありません。**

## 機能

- 🎯 **気分診断** — 気分・テンポ・シーンの3問でベスト5曲を提案
- 🎵 **全曲リスト** — 検索・五十音・タグフィルターで曲を探す
- ❤️ **お気に入り** — 好きな曲をブックマーク
- 🌙 **聴いた記録** — 歌ってもらえた曲を記録
- 🎲 **シャッフル** — ランダムに1曲を表示
- 📋 **リクエスト文コピー** — そのままチャットに貼れる文章をコピー

## 技術スタック

- バニラ HTML / CSS / JavaScript（フレームワーク不使用）
- ES Modules
- LocalStorage でデータ保存
- GitHub Pages でデプロイ

## ローカル起動

`fetch()` で songs.json を読み込むため、HTTP サーバーが必要です。

```bash
# Node.js がある場合
npx serve .

# Python がある場合
python3 -m http.server 8080
```

ブラウザで `http://localhost:3000`（または 8080）を開きます。

## デプロイ

GitHub Pages にプッシュするだけで公開されます。  
`main` ブランチの root を公開設定にしてください。

## 曲データの更新

`data/songs.json` を編集するだけです。

```json
{
  "id": "157",
  "title": "曲名",
  "artist": "アーティスト名",
  "kanaSection": "あ",
  "tags": {
    "mood": ["切ない"],
    "tempo": "ミドル",
    "scene": ["泣きたい夜"]
  }
}
```

## ディレクトリ構成

```
all-night-songs/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js       # エントリーポイント・ルーティング
│   ├── data.js       # 曲データ読み込み
│   ├── matching.js   # マッチングロジック
│   ├── storage.js    # LocalStorage操作
│   ├── ui.js         # 各画面のレンダリング
│   └── utils.js      # ユーティリティ関数
├── data/
│   └── songs.json    # 全曲データ（156曲）
└── assets/
    └── (アイコン類)
```

## メンテナー

MofMofJPN（モフたん / Motobu）
