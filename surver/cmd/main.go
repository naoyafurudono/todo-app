package main

import (
	"log"
	"net/http"

	"todo-server/util/space"
)

func main() {
	addr := ":8080"

	space := space.NewSpace("sample")
	go space.Run()
	http.Handle("/ws", space)
	
	log.Printf("サーバを開始します: ws://localhost/ws%s\n", addr)
	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}
