package space

import (
	"log"
	"net/http"
	"todo-server/util/transformer"

	"github.com/gorilla/websocket"
)

// clientのモデル
type client struct {
	// フロントエンドとの接続
	socket *websocket.Conn
	send   chan *transformer.Event
	space  *Space
}

// フロント -- startRead --> broad cast
// ws接続の切断で終了する
func (c *client) startRead() {
	for {
		var msg transformer.Command
		if err := c.socket.ReadJSON(&msg); err == nil {
			c.space.forward <- &msg
			log.Println("read succeed")
		} else {
			log.Println("client.startRead:", err)
			break
		}
	}
	c.socket.Close()
}

// spaceからのsendチャネルのclose、またはws接続の切断で終了する
func (c *client) startWrite() {
	for event := range c.send {
		log.Printf("client.startWrite: %+v", *event)
		if err := c.socket.WriteJSON(event); err != nil {
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
