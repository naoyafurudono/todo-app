package space

import (
	"todo-server/util/transformer"
)

// type SpaceHandle struct {
// 	spaces map[string]Space
// }

// // func newSpaceHandle() SpaceHandle {
// // 	return SpaceHandle{}
// // }

// // spaceへの接続要求を処理する。
// // 該当スペースで受け入れる
// func (handle SpaceHandle) ServeHTTP(w http.ResponseWriter, r *http.Request) {
// 	query := r.URL.Query()
// 	spaceName := query.Get("space")
// 	if spaceName == "" {
// 		spaceName = "sample"
// 	}

// 	if _, exist := handle.spaces[spaceName]; !exist {
// 		space := NewSpace(spaceName)
// 		handle.spaces[spaceName] = space
// 		space.run()
// 	}

// }

// type Message string
type Message transformer.Command

// チャットの部屋
type Space struct {
	Forward chan *Message
	join    chan *client
	leave   chan *client
	clients map[*client]bool // 所有する
	Name    string
}

func NewSpace(name string) Space {
	return Space{
		Forward: make(chan *Message),
		join:    make(chan *client),
		leave:   make(chan *client),
		clients: make(map[*client]bool),
		Name:    name,
	}
}

// spaceのセッション
func (s *Space) Run() {
	for {
		select {
		case client := <-s.join:
			s.clients[client] = true
		case client := <-s.leave:
			delete(s.clients, client)
			close(client.send)

			if len(s.clients) == 0 {
				return
			}
		case msg := <-s.Forward:
			for client := range s.clients {
				client := client
				select {
				case client.send <- msg:
					// success to send message
				default:
					// 送信に失敗
					// clientを殺す
					delete(s.clients, client)
					close(client.send)
				}
			}
		}
	}
}
