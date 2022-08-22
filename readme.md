# todo app

> **Note**
> 人事面接などで見せられるものが欲しいので開発。
> どんな技術を使えるかや、その使い方を見せることが目的。
> このreadmeを含めて、独力で開発する。

## 目次

- [todo app](#todo-app)
  - [目次](#目次)
  - [アプリの説明](#アプリの説明)
  - [実行フローの概要](#実行フローの概要)
    - [開始](#開始)
    - [ユーザ操作](#ユーザ操作)
    - [保存](#保存)
    - [懸念](#懸念)
      - [操作結果の整合性](#操作結果の整合性)
  - [使う技術](#使う技術)
  - [プログラムの設計](#プログラムの設計)
    - [クライアント](#クライアント)
    - [サーバ](#サーバ)
  - [実装の工程管理](#実装の工程管理)
  - [参考文献](#参考文献)

## アプリの説明

- Todoアプリ
- Webアプリケーション
- Todoタスクの登録、削除、編集、保存、Todo/Doneの切り替えがGUIでできる
- マルチユーザで同時に編集可能

## 実行フローの概要

次の３つに分ける。

1. 開始
1. ユーザ操作
1. 永続化

> **Note**
> このセクションのフロー図は mermaidを使って書きました。
> <https://mermaid-js.github.io/mermaid/#/sequenceDiagram>

### 開始

サーバはページの送信、Todoデータの取得、クライアントへの反映を行う。
状態の反映はWebSocketを通じて行う。

```mermaid
sequenceDiagram
    participant client
    participant server
    participant storage

    client ->> server: アクセス
    server ->> client: ページ
    server ->> storage: データ取得
    client ->> server: WebSocketセッションの開始
    server ->> client: 状態反映
    Note over client, server: ユーザ操作
```

### ユーザ操作

ユーザがアプリケーションを操作する場面。変更は随時サーバに同期する。
ここでは永続化はしないで、サーバのメモリに起きたイベントを保持する。

```mermaid
sequenceDiagram
    actor user
    participant client
    participant server
    participant another client
    participant storage

    client ->> server: WebSocketセッションの開始
    activate client 
    loop 該当する編集操作ごとに
      user ->> client: Todoの操作
      client ->> server: Todoリストの編集イベント
      Note over server: イベントにタイムスタンプ付与
      server ->> another client: Todoリストの編集イベント
      server ->> client: Todoリストの編集イベント

    end
    client ->> server: 切断
    deactivate client
```

### 保存

セッションの終了時にサーバは永続化処理を行う。
永続化は２種類のデータについて行う：

- Todoの編集イベント
- Todoリストの現在の状態

現在の状態は「開始」で取得する前回の状態と、今回の編集イベントから計算する。

```mermaid
sequenceDiagram
    participant client
    participant server
    participant storage

    Note over client, server: ユーザ操作
    server ->> storage: 永続化
```

### 懸念

設計の懸念点を議論する。

#### 操作結果の整合性

- イベントをクライアントと、サーバのそれぞれで解釈する。実装のミスで解釈の結果が一致しないと、ユーザがクライアントを通して見ていた結果と異なるTodoリストの状態がストレージに保存される。
- 整合性を保証することが実装上の負荷になる。

対策としては、コードを共通化することが考えられる。
たとえばサーバとクライントを両方JSで書くことにして、状態遷移の実装や状態のエンコード/デコードはサーバ、クライアント間で共通のコードを用いれば良い。
サーバでJSを使いたくなければ、サーバのコードをJSにコンパイルして、それをクライアントで使う手もある。手間は掛かりそうだし、JSへのコンパイルに対応している言語に制限されはするが。

~~今回はGolangをサーバで使うことにしたので、[GopherJS](https://github.com/gopherjs/gopherjs)をコンパイラとして使うことにする。~~
よくよく調べてみたら、GopherJSはメイン関数を定義しないとコンパイルできないみたいだ。
結合が面倒になりそうなので、諦めてクライアントとバックエンドのそれぞれにイベント処理を書く。

## 使う技術

- クライアント: React with TypeScript, GopherJS
- サーバ: Golang
- サーバインフラ: Google App Engine, Google Cloud SQL
- その他
  - WebSocketによる通信

## プログラムの設計

### クライアント

```mermaid
sequenceDiagram
    actor user
    participant view
    participant transformer
    participant server

    view -> server : init
    view ->> transformer : init
    loop on interact
      user ->> view : input
      view ->> transformer: feed event
      view ->> server : feed event
      note over server : save event on memory
      transformer ->> view: new state
      view ->> user : show view
    end
    user ->> view : close
    view ->> server : finish
```

`transformer` はGoで実装してGopherJSでコンパイルしたものを必要に応じてラップして実装する。

### サーバ

ページの配信は省略

```mermaid
sequenceDiagram
    participant client
    participant HTTP handler
    participant session
    participant SQL server
    participant transformer

    client ->> HTTP handler  : init WebSocket
    HTTP handler ->> session : init
    client -> session        : establish WebSocket connection
    session ->> SQL server   : get last state
    SQL server ->> session   : feed last state
    session ->> client       : feed last state
    loop until client close the WS session
      client ->> session     : feed event
      note over session      : save event on memory
    end
    
    session ->> transformer  : call as function with fed events
    transformer ->> session  : final state
    session ->> SQL server   : perpetuate final state
```

## 実装の工程管理

- [x] Transformer
- [x] View (transformerとやりとりして、リストをアップデートできる)  -- (ここまでで見た目は整う)
- [ ] HTTP server += WebSocket (session のモック)
- [ ] View += WebSocket -- (イベントや状態の共有が完成)
- [ ] SQL server
- [ ] HTTP server += SQL server
- [ ] Session += SQL connection
- [ ] Session += transformer

## 参考文献

- [mermaid](https://mermaid-js.github.io/mermaid/#/sequenceDiagram?id=configuration): シーケンス図の書き方
- [GopherJS](https://github.com/gopherjs/gopherjs): Go -> JS コンパイラ。~~transformerのソースコードを共通化するために使用~~
  - やっぱり使わないことにした。
