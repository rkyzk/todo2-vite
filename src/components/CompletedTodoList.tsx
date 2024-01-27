import { useRecoilState, useRecoilValue } from "recoil";
import { todoListState } from "../states/TodoListState";
import { Task } from "../types/Task";
import React, { useCallback } from "react";
import "../styles/CompletedTodoList.module.css";
import { ref, remove, update } from "firebase/database";
import { db } from "../../FirebaseConfig";
import {
  completedListState,
  completedTodosCount,
} from "../states/CompletedListState";
import { Box, Button, Text } from "@chakra-ui/react";

export const CompletedTodoList = () => {
  /** 完了Todoの件数取得 */
  const numCompletedTodos = useRecoilValue(completedTodosCount);
  /**　Todoリスト取得 */
  const [todoList, setTodoList] = useRecoilState(todoListState);
  /**　完了Todoリスト取得 */
  const completedList: Task[] = useRecoilValue(completedListState);

  /** Todoを完了リストから未完了のリストへ移動 */
  const putBackItem = useCallback(
    (e: React.MouseEvent, item: Task) => {
      /** DBを更新 */
      const editedItem: Task = { ...item, status: "inProgress" };
      updateTodoData(editedItem);
      // 画面上でリストを更新
      const newList = [...todoList];
      setTodoList(
        newList.map((todo) => {
          return todo.id === item.id ? editedItem : todo;
        })
      );
    },
    [todoList]
  );

  /** TodoをcompleteListより削除する */
  const handleDelete = useCallback(
    (e: React.MouseEvent | null, item: Task) => {
      deleteTodoData(item); // DBより削除
      /** 画面より削除 */
      const newList = [...todoList].filter((todo) => todo.id !== item.id);
      setTodoList(newList);
    },
    [todoList]
  );

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
          <Box display="flex" justifyContent="center">
            <Text mr="4px" mt="4px" fontWeight="400" fontSize="1.2rem">
              <i className="fa-solid fa-check-double"></i>
            </Text>
            <Text fontSize="1.5rem" textAlign={["center"]} mb={4}>
              完了Todoリスト
            </Text>
          </Box>
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
            <Text ml="31px" mb={0}>
              期日
            </Text>
            <Text ml="94px" mb={0}>
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
              pl="2px"
              py="4px"
            >
              <Text w="242px" pl="2px">
                {item.title}
              </Text>
              <Text w="242px">{item.details}</Text>
              <Text w="105px" pl="5px">
                完了
              </Text>
              <Text w="124px" ml="4px">
                {item.deadline}
              </Text>
              <Text w="95px">{item.createdAt}</Text>
              <Button
                ml="4px"
                mr="3px"
                h="32px"
                backgroundColor="orange"
                fontSize="0.8rem"
                color="white"
                px="10px"
                onClick={(e: React.MouseEvent) => putBackItem(e, item)}
              >
                戻す
              </Button>
              <Button
                h="32px"
                backgroundColor="orange"
                fontSize="0.8rem"
                color="white"
                px="10px"
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
