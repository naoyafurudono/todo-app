package space

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

// clientのモデル
type client struct {
	// フロントエンドとの接続
	socket *websocket.Conn
	send   chan *State
	space  *Space
	name   string
}

// フロント -- fromClient --> broad cast
// ws接続の切断で終了する
func (c *client) fromClient() {
	for {
		var cmd Request
		if err := c.socket.ReadJSON(&cmd); err == nil {
			request := forwardMessage{&cmd, c}
			c.space.forward <- &request
			log.Printf("client %s read succeed\n", c.name)
		} else {
			log.Println("client.fromClient:", err)
			break
		}
	}
	c.socket.Close()
}

// spaceからのsendチャネルのclose、またはws接続の切断で終了する
func (c *client) toClient() {
	for state := range c.send {
		if err := c.socket.WriteJSON(state); err != nil {
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
