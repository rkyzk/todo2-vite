import { useRecoilState, useRecoilValue } from "recoil";
import { todoListState } from "../states/TodoListState";
import { Task } from "../types/Task";
import React from "react";
import "../styles/CompletedTodoList.module.css";
import { ref, remove, update } from "firebase/database";
import { db } from "../../FirebaseConfig";
import {
  completedListState,
  completedTodosCount,
} from "../states/CompletedListState";
import { editIdState } from "../states/EditIdState";
import { Box, Button, Text } from "@chakra-ui/react";

export const CompletedTodoList = () => {
  /** 完了Todoの数を取得 */
  const numCompletedTodos = useRecoilValue(completedTodosCount);
  const [todoList, setTodoList] = useRecoilState(todoListState);
  const completedList: Task[] = useRecoilValue(completedListState);
  const [editId, setEditId] = useRecoilState(editIdState);

  /** Todoを完了リストから未完了のリストへ移動 */
  const putBackItem = (e: React.MouseEvent, item: Task) => {
    // 更新フォームが開いていたら閉じる。
    setEditId("");
    const editedItem: Task = { ...item, status: "inProgress" };
    updateTodoData(editedItem); // DBを更新
    // 画面上でリストを更新
    const newList = [...todoList];
    setTodoList(
      newList.map((todo) => {
        return todo.id === item.id ? editedItem : todo;
      })
    );
  };

  /** todoをcompleteListより削除する */
  const handleDelete = (e: React.MouseEvent | null, item: Task) => {
    // 更新フォームが開いていたら閉じる。
    setEditId("");
    deleteTodoData(item); // DBより削除
    const newList = [...todoList].filter((todo) => todo.id !== item.id);
    setTodoList(newList); // 画面より削除
  };

  /** Firebase DBのTodoアイテムを削除 */
  const deleteTodoData = async (item: Task) => {
    try {
      const taskRef = ref(db, "tasks/" + item.id);
      remove(taskRef);
    } catch (error) {
      alert("エラー発生。todoは削除されませんでした。");
    }
  };

  /** Firebase DBのTodoの情報を更新 */
  const updateTodoData = async (item: Task) => {
    try {
      const taskRef = ref(db, "tasks/" + item.id);
      update(taskRef, item);
    } catch (error) {
      alert("エラー発生。データが保存されませんでした。");
    }
  };

  return (
    <>
      {numCompletedTodos > 0 && (
        <Box w="950px" mt={10} mx="auto">
          <Text fontSize="1.6rem" textAlign={["center"]} mb={4}>
            完了Todoリスト
          </Text>
          {/** 完了リストのヘッダー */}
          <Box display="flex" mb={0} pb={0}>
            <Text ml="2px" mb={0}>
              タイトル
            </Text>
            <Text ml="182px" mb={0}>
              内容
            </Text>
            <Text ml="205px" mb={0}>
              ステータス
            </Text>
            <Text ml="32px" mb={0}>
              期日
            </Text>
            <Text ml="64px" mb={0}>
              記載日
            </Text>
          </Box>
          {completedList.map((item: Task) => (
            <Box
              key={item.id}
              display="flex"
              alignItems="center"
              mt={1}
              backgroundColor="#fafafa"
              borderRadius="5px"
              border="#347"
              px={2}
              py={0}
            >
              <Text w="242px">{item.title}</Text>
              <Text w="242px">{item.details}</Text>
              <Text w="105px" pl="5px">
                完了
              </Text>
              <Text w="95px">{item.deadline}</Text>
              <Text w="95px">{item.createdAt}</Text>
              <Button
                px="7px"
                py="5px"
                fontSize="0.8rem"
                onClick={(e: React.MouseEvent) => putBackItem(e, item)}
              >
                戻す
              </Button>
              <Button
                px="7px"
                py="5px"
                fontSize="0.8rem"
                onClick={(e: React.MouseEvent) => handleDelete(e, item)}
              >
                削除
              </Button>
            </Box>
          ))}
        </Box>
      )}
    </>
  );
};
