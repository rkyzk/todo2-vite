import { useRecoilState, useRecoilValue } from "recoil";
import { editIdState } from "../states/EditIdState";
import {
  todoListState,
  todoListStateLength,
  fetchData,
} from "../states/TodoListState";
import "../styles/TodoList.module.css";
import { Task } from "../types/Task";
import React, { useCallback, ComponentState, useEffect } from "react";
import { editTodoState } from "../states/EditTodoState";
import {
  filteredListState,
  filteredListStateLength,
} from "../states/FilteredListState";
import { filterState } from "../states/FilterState";
import { db } from "../../FirebaseConfig";
import { ref, update, remove } from "firebase/database";
import {
  completedListState,
  completedTodosCount,
} from "../states/CompletedListState";
import { Box, Text, Button, Input, Select } from "@chakra-ui/react";

/** Todoリストを表示、Todo更新削除処理をするコンポーネント */
export const TodoList = () => {
  /** 編集中todo の内容を格納 */
  const [editTodo, setEditTodo] = useRecoilState(editTodoState);
  /** Todoリストの内容を格納 （全ステータス）*/
  const [todoList, setTodoList] = useRecoilState(todoListState);
  /** Todoリスト内の件数 */
  const todosCount: number = useRecoilValue(todoListStateLength);
  /** フィルターで絞ったリストの内容を格納（表示するTodos） */
  const [filteredList, setFilteredList] = useRecoilState(filteredListState);
  /** フィルターで絞ったTodo件数 */
  const filteredTodosCount = useRecoilValue(filteredListStateLength);
  /** 編集中todo の idを格納 */
  const [editId, setEditId] = useRecoilState(editIdState);
  /** フィルターするステータス */
  const [filter, setFilter] = useRecoilState(filterState);
  /** 完了リスト */
  const [completedList, setCompletedList] = useRecoilState(completedListState);
  /** 完了Todoの件数取得 */
  const numCompletedTodos = useRecoilValue(completedTodosCount);

  /** 初回レンダリング時にDBのTodoリストを変数todoListに格納 */
  useEffect(() => {
    const setList = async () => {
      const data: Task[] = await fetchData();
      data.length > 0 && setTodoList(data);
    };
    setList();
  }, []);

  /** ステータス完了のtodoを完了Todoリストに格納 */
  useEffect(() => {
    const newList = todoList.filter((elem) => elem.status === "done");
    setCompletedList(newList);
  }, [todoList]);

  /** 選択されたステータスにより抽出したtodoをフィルターTodoリストに格納 */
  useEffect(() => {
    // ステータス完了以外のtodoを取得
    const list = todoList.filter((todo) => todo.status !== "done");
    if (filter === "all") {
      setFilteredList(list);
    } else {
      const newList = list.filter((todo) => todo.status === filter);
      setFilteredList(newList);
    }
  }, [todoList, filter]);

  /** 変数editTodoを初期値に戻す */
  const clearEditTodo = useCallback(() => {
    setEditTodo({
      id: "",
      title: "",
      status: "notStarted",
      details: "",
      deadline: "",
      createdAt: "",
    });
  }, []);

  /** 更新フォームが表示されている時、フォームの外側がクリックされたらフォームを閉じる */
  const handleClickOutsideEditForm = useCallback((e: any) => {
    // 更新フォーム外がクリックされた場合
    !e.target.classList.contains("edtForm") && closeEditForm();
  }, []);

  /** 更新フォームを閉じる */
  const closeEditForm = useCallback(() => {
    setEditId("");
    clearEditTodo();
    // イベントリスナーを削除
    document.removeEventListener("click", handleClickOutsideEditForm);
  }, []);

  /** 更新ボタン押下時に更新フォームを表示 */
  const showEditForm = useCallback((item: Task) => {
    setEditId(item.id);
    setEditTodo(item);
    // 次回クリックでクリックされる要素を判断するためイベントリスナー追加
    setTimeout(() => {
      document.addEventListener("click", (e) => handleClickOutsideEditForm(e));
    }, 200);
  }, []);

  /** 更新フォームのタイトル、詳細の入力値を画面に表示 */
  const handleOnChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const task: Task = {
        ...editTodo,
        [e.target.name]: e.target.value,
      };
      setEditTodo(task);
    },
    [editTodo]
  );

  /** 編集中にステータスが変更された際、入力値を取得しeditTodoを更新 */
  const handleChangeSelect = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const task: Task = {
        ...editTodo,
        status: e.target.value,
      } as ComponentState;
      setEditTodo(task);
    },
    [editTodo]
  );

  /** 更新ボタンは押さないまま、ステータスのみ変更された際、
   * 入力値を取得しeditTodoリストを更新。*/
  const onChangeSelectListItem = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>, item: Task) => {
      // 更新するtodoを変数に格納
      const task: Task = { ...item, status: e.target.value } as ComponentState;
      updateTodoData(task); // DBを更新
      // todoListに格納するリストを作成
      const newList = [...todoList].map((todo) => {
        return item.id === todo.id ? task : todo;
      });
      setTodoList(newList); //　画面を更新
    },
    [todoList]
  );

  /** Firebase DBのTodoの情報を更新 */
  const updateTodoData = async (item: Task) => {
    try {
      const taskRef = ref(db, "tasks/" + item.id);
      update(taskRef, item);
    } catch (error) {
      alert("エラー発生。データが保存されませんでした。");
    }
  };

  /** Firebase DBよりTodoアイテムを削除 */
  const deleteTodoData = async (item: Task) => {
    try {
      const taskRef = ref(db, "tasks/" + item.id);
      remove(taskRef);
    } catch (error) {
      alert("エラー発生。Todoが削除されませんでした。");
    }
  };

  /** 保存ボタン押下時にリストを更新し、更新フォームを閉じる。 */
  const handleEdit = useCallback(
    (e: React.FormEvent<HTMLFormElement>, item: Task) => {
      e.preventDefault();
      document.removeEventListener("click", handleClickOutsideEditForm);
      updateTodoData(editTodo); // DB更新
      // 画面更新
      const newList = [...todoList].map((todo) => {
        return todo.id === item.id ? editTodo : todo;
      });
      setTodoList(newList);
      clearEditTodo(); // editTodoを初期値に戻す
      closeEditForm(); // 更新フォームを閉じる
    },
    [todoList, editTodo]
  );

  /** todoを削除する */
  const handleDelete = useCallback(
    (item: Task) => {
      // DBより削除
      const newList = [...todoList].filter((todo) => todo.id !== item.id);
      deleteTodoData(item);
      setTodoList(newList); // TodoListより削除
    },
    [todoList]
  );

  /** Todoリストをステータスによりフィルターする */
  const onChangeFilter = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      // 変数filterを更新
      setFilter(e.target.value as ComponentState);
      // filteredListを更新
      const list: Task[] = [...todoList];
      const newList: Task[] = list.filter((todo) => todo.status === filter);
      setFilteredList(newList);
    },
    [filter, todoList]
  );

  /** Todoを期日が近い順に並べ替える */
  const handleSort = useCallback(() => {
    const list: Task[] = [...todoList];
    /** 期日の記載がないtodoを格納 */
    const withoutDeadline: Task[] = [];
    /** 期日の記載があるtodoを格納 */
    const withDeadline: Task[] = [];
    list.forEach((todo) =>
      todo.deadline === ""
        ? withoutDeadline.push(todo)
        : withDeadline.push(todo)
    );
    /** 期日のあるtodoを近い順に並べ変える*/
    const sortedList: Task[] = withDeadline.sort(
      (a, b) => Date.parse(a.deadline) - Date.parse(b.deadline)
    );
    /** 期日のないtodoは後方に格納 */
    const newList: Task[] = [...sortedList, ...withoutDeadline];
    setTodoList(newList);
  }, [todoList]);

  return (
    <Box w="950px" mt={12} mx="auto">
      <Box display="flex" justifyContent="center">
        <Text mr="4px" mt="4px" fontWeight="400" fontSize="1.2rem">
          <i className="fa-solid fa-person-digging"></i>
        </Text>
        <Text fontSize="1.6rem" textAlign={["center"]} mb={4}>
          Todoリスト
        </Text>
      </Box>
      <Box>
        {todosCount > numCompletedTodos ? (
          <>
            {/** 未完了todoがある場合 */}
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
            <Box
              ml="486px"
              display="flex"
              justifyContent="start"
              alignItems="center"
              mb={0}
              pb={0}
            >
              <Select
                size="sm"
                h="28px"
                mt={0}
                w="101px"
                name="filter"
                backgroundColor="white"
                borderColor="gray"
                borderRadius="5px"
                value={filter}
                onChange={onChangeFilter}
              >
                <option value="all">全て</option>
                <option value="notStarted">未着手</option>
                <option value="inProgress">進行中</option>
              </Select>
              <Button
                h="27px"
                backgroundColor="orange"
                color="white"
                ml="10px"
                px="6px"
                py="1px"
                onClick={handleSort}
              >
                <Text fontSize="0.8rem">並べ替え</Text>
                <Text fontWeight="700">↑</Text>
              </Button>
            </Box>
            {/** フィルター有無関わらず表示するTodoがある場合 */}
            {filteredTodosCount > 0 ? (
              filteredList.map((item) =>
                item.id === editId ? (
                  <Box
                    id="editForm"
                    key={item.id}
                    className="edtForm"
                    mt="3px"
                    backgroundColor="orange"
                    borderRadius="5px"
                    border="#347"
                    px="2px"
                    py="4px"
                  >
                    <form
                      onSubmit={(e: React.FormEvent<HTMLFormElement>) =>
                        handleEdit(e, item)
                      }
                    >
                      {/** 編集中Todoの行 */}
                      <Box
                        display="flex"
                        justifyContent="start"
                        alignItems="center"
                        className="edtForm"
                      >
                        <Input
                          size="sm"
                          type="text"
                          className="edtForm"
                          backgroundColor="white"
                          name="title"
                          id="editTitle"
                          ml="2px"
                          w="240px"
                          borderRadius="5px"
                          onChange={handleOnChange}
                          value={editTodo?.title}
                          required
                        />
                        <Input
                          type="text"
                          size="sm"
                          className="edtForm"
                          name="details"
                          w="238px"
                          backgroundColor="white"
                          borderRadius="5px"
                          onChange={handleOnChange}
                          value={editTodo?.details}
                        />
                        <Select
                          name="status"
                          className="edtForm"
                          size="sm"
                          w="97px"
                          h="32px"
                          backgroundColor="white"
                          borderColor="transparent"
                          borderRadius="5px"
                          value={editTodo?.status}
                          onChange={handleChangeSelect}
                        >
                          <option value="notStarted">未着手</option>
                          <option value="inProgress">進行中</option>
                          <option value="done">完了</option>
                        </Select>
                        <Input
                          type="date"
                          name="deadline"
                          className="edtForm"
                          size="sm"
                          ml="6px"
                          w="128px"
                          borderRadius="5px"
                          backgroundColor="white"
                          value={editTodo?.deadline}
                          onChange={handleOnChange}
                        />
                        <Text ml="2px" w="95px" className="edtForm">
                          {editTodo?.createdAt}
                        </Text>
                        <Button
                          mr="3px"
                          h="32px"
                          className="edtForm"
                          backgroundColor="aliceblue"
                          fontSize="0.8rem"
                          color="charcoal"
                          px="7px"
                          py="2px"
                          type="submit"
                        >
                          保存
                        </Button>
                        <Button
                          type="button"
                          h="32px"
                          backgroundColor="aliceblue"
                          fontSize="0.8rem"
                          color="charcoal"
                          px="4px"
                          py="2px"
                          onClick={closeEditForm}
                        >
                          キャンセル
                        </Button>
                      </Box>
                    </form>
                  </Box>
                ) : (
                  <Box
                    key={item.id}
                    display="flex"
                    alignItems="center"
                    mt="3px"
                    backgroundColor="#fafafa"
                    borderRadius="5px"
                    border="#347"
                    px="5px"
                    py="3px"
                  >
                    {/** 編集中ではないTodoの行 */}
                    <Text w="240px">{item.title}</Text>
                    <Text w="240px">{item.details}</Text>
                    <Select
                      name="status"
                      w="102px"
                      h="34px"
                      borderRadius="5px"
                      borderColor="gray"
                      backgroundColor="white"
                      my={0}
                      value={item.status}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        onChangeSelectListItem(e, item)
                      }
                    >
                      <option value="notStarted">未着手</option>
                      <option value="inProgress">進行中</option>
                      <option value="done">完了</option>
                    </Select>
                    <Text w="120px" marginLeft="6px">
                      {item.deadline}
                    </Text>
                    <Text w="95px" marginLeft="8px">
                      {item.createdAt}
                    </Text>
                    <Button
                      mr="3px"
                      h="32px"
                      className="edtForm"
                      backgroundColor="orange"
                      fontSize="0.8rem"
                      color="white"
                      px="10px"
                      py="2px"
                      ml="2px"
                      onClick={() => showEditForm(item)}
                    >
                      編集
                    </Button>
                    <Button
                      h="32px"
                      backgroundColor="orange"
                      fontSize="0.8rem"
                      color="white"
                      px="10px"
                      py="2px"
                      onClick={() => handleDelete(item)}
                    >
                      削除
                    </Button>
                  </Box>
                )
              )
            ) : (
              <Text fontSize="1.4rem" textAlign="center" marginTop={4}>
                当該ステータスのTodoなし
              </Text>
            )}
          </>
        ) : (
          <Text fontSize="1.4rem" textAlign="center" marginTop={4}>
            未完了Todoなし
          </Text>
        )}
      </Box>
    </Box>
  );
};
