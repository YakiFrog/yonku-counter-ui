# 四駆カウンターUI

このプロジェクトは、ミニ四駆レース管理のためのElectronとNext.js、Chakra UIを使用したデスクトップアプリケーションです。レースの進行状況、タイム計測、ランキングの管理などの機能を提供します。

## 機能概要

- **レース管理**: 4つのコースでのレースをリアルタイムにモニター
- **タイム計測**: 経過時間のストップウォッチ機能
- **周回カウント**: 各コースの周回数を視覚的に表示
- **選手と車両管理**: 選手リストと車両を管理
- **ランキング表示**: レース結果とランキングの表示
- **設定**: レースの基本設定、選手/車両登録、コース割り当て

## 技術スタック

- **フレームワーク**: Electron + Next.js
- **UI**: Chakra UI
- **言語**: TypeScript

## 画面構成

アプリケーションは主に3つのタブで構成されています：

### 1. レース管理画面

- 左側に4コース分の選手・車両情報
- 右側に大きく経過時間を表示
- 各コースの周回数を管理するボタン
- スタート/一時停止、リセットなどのコントロールボタン

### 2. ランキング画面

- 最新レース結果表示
- 総合ランキング表示

### 3. 設定画面

- 基本設定（周回数など）
- 選手/車両登録管理
- コースへの選手と車両の割り当て

## システム構成図

```mermaid
graph TD
    subgraph "四駆カウンターUIアプリ"
        A[メインプロセス] --> B[レンダラープロセス]
        B --> C[タブナビゲーション]
        C --> D[レース管理]
        C --> E[ランキング]
        C --> F[設定]
        
        subgraph "レース管理"
            D --> D1[周回カウント]
            D --> D2[タイム計測]
            D --> D3[レース状態管理]
        end
        
        subgraph "ランキング"
            E --> E1[最新結果]
            E --> E2[総合ランキング]
        end
        
        subgraph "設定"
            F --> F1[基本設定]
            F --> F2[選手/車両管理]
            F --> F3[コース割り当て]
        end
    end
    
    A <-.-> G[ハードウェア]
    
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#bbf,stroke:#333,stroke-width:2px
    style C fill:#ddf,stroke:#333,stroke-width:1px
    style D fill:#dfd,stroke:#333,stroke-width:1px
    style E fill:#dfd,stroke:#333,stroke-width:1px
    style F fill:#dfd,stroke:#333,stroke-width:1px
    style G fill:#fdd,stroke:#333,stroke-width:2px
```

## データフロー

```mermaid
flowchart LR
    A[設定] --> B[レース管理]
    B --> C[ランキング]
    
    subgraph "データ"
        D[選手データ]
        E[車両データ]
        F[レース結果]
    end
    
    A --> D & E
    B --> F
    C --> F
```

## 状態管理

```mermaid
stateDiagram-v2
    [*] --> 準備中
    準備中 --> レース中: スタート
    レース中 --> 一時停止: 一時停止
    一時停止 --> レース中: 再開
    レース中 --> 完了: レース終了
    一時停止 --> 準備中: リセット
    完了 --> 準備中: 新規レース
```

## クラス図

```mermaid
classDiagram
    class Player {
        +string id
        +string name
        +Vehicle[] vehicles
    }
    
    class Vehicle {
        +string id
        +string name
    }
    
    class Course {
        +string playerId
        +string vehicleId
        +int currentLap
        +int totalLaps
        +incrementLap()
        +decrementLap()
    }
    
    class Race {
        +Course[] courses
        +DateTime startTime
        +DateTime endTime
        +boolean isRunning
        +start()
        +pause()
        +reset()
    }
    
    class RaceResult {
        +string raceId
        +CourseResult[] results
    }
    
    class CourseResult {
        +string playerId
        +string vehicleId
        +int position
        +string time
        +string bestLap
    }
    
    Player "1" -- "n" Vehicle : owns
    Course "1" -- "0..1" Player : assigned
    Course "1" -- "0..1" Vehicle : uses
    Race "1" -- "4" Course : has
    Race "1" -- "1" RaceResult : produces
    RaceResult "1" -- "n" CourseResult : contains
```

## 開発環境のセットアップ

```bash
# リポジトリをクローン
git clone <リポジトリURL>

# 依存関係のインストール
cd yonku-counter-ui
npm install

# 開発サーバーの起動
npm run dev
```

## ビルド

```bash
# パッケージ化
npm run build

# 配布用ファイルの生成
npm run dist
```

---

© 2025 NLAB プロジェクト