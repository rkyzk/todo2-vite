import { AddTodo } from "./components/AddTodo";
import { TodoList } from "./components/TodoList";
import { CompletedTodoList } from "./components/CompletedTodoList";
import { Box } from "@chakra-ui/react";
import { RecoilRoot } from "recoil";

export const Todo = () => {
  return (
    <RecoilRoot>
      <Box backgroundColor="#eee" height="100vh" width="100%" marginTop={-10}>
        <AddTodo />
        <TodoList />
        <CompletedTodoList />
      </Box>
    </RecoilRoot>
  );
};
