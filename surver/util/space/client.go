package space

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

// clientのモデル
type client struct {
	// フロントエンドとの接続
	socket *websocket.Conn
	send   chan *Message
	space  *Space
}

// フロント -- startRead --> broad cast
// ws接続の切断で終了する
func (c *client) startRead() {
	for {
		var msg Message
		if err := c.socket.ReadJSON(&msg); err == nil {
			c.space.Forward <- &msg
			log.Println("read succeed")
		} else {
			log.Println("client.read:", err)
			break
		}
	}
	c.socket.Close()
}

// spaceからのsendチャネルのclose、またはws接続の切断で終了する
func (c *client) startWrite() {
	for msg := range c.send {
		if err := c.socket.WriteJSON(msg); err != nil {
			break
		}
	}
	c.socket.Close()
}

const (
	socketBufferSize  = 1024
	messageBufferSize = 256
)

var upgrader = &websocket.Upgrader{
	ReadBufferSize:  socketBufferSize,
	WriteBufferSize: socketBufferSize,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

// client session
func (s Space) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	fmt.Println("WS come")
	socket, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal("ServeHTTP:", err)
		return
	}

	client := &client{
		socket: socket,
		send:   make(chan *Message, messageBufferSize),
		space:  &s,
	}
	// if authCookie, err := req.Cookie("auth"); err == nil {
	// 	name := authCookie.Value
	// 	client.name = name
	// }

	s.join <- client
	defer func() { s.leave <- client }()
	go client.startWrite()
	client.startRead()
}
