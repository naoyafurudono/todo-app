package transformer

import (
	"fmt"
	"testing"
)

func Test_Reduce(t *testing.T) {
	state := State{}
	cmds := []Command{
		{Operation: Create, Payload: Payload{Statement: "do test"}},
		{Operation: Create, Payload: Payload{Statement: "finish test"}},
		{Operation: ToggleDone, Payload: Payload{ID: "0000000000"}},
		{Operation: ModifyStatement, Payload: Payload{ID: "0000000000", Statement: "just do it!!"}},
	}

	for _, cmd := range cmds {
		Reduce(&state, cmd)
		for _, item := range state.Items {
			fmt.Printf("%v\n", item)
		}
		fmt.Println("---")
	}

}
