import { useRecoilState, useRecoilValue } from "recoil";
import { editIdState } from "../states/EditIdState";
import {
  todoListState,
  todoListStateLength,
  fetchData,
} from "../states/TodoListState";
import "../styles/TodoList.module.css";
import { Task } from "../types/Task";
import React, {
  useCallback,
  ComponentState,
  useEffect,
  useRef,
  useLayoutEffect,
} from "react";
import { editTodoState } from "../states/EditTodoState";
import {
  filteredListState,
  filteredListStateLength,
} from "../states/FilteredListState";
import { filterState } from "../states/FilterState";
import { db } from "../../FirebaseConfig.js";
import { ref, update, remove } from "firebase/database";
import { completedListState } from "../states/CompletedListState";
import { Box, Text, Button, Input, Select } from "@chakra-ui/react";

/** Todoリストを表示、更新削除機能などを持つコンポーネント */
export const TodoList = () => {
  /** 編集中todo の内容を格納 */
  const [editTodo, setEditTodo] = useRecoilState(editTodoState);
  /** Todoリストの内容を格納 （全ステータス含む）*/
  const [todoList, setTodoList] = useRecoilState(todoListState);
  /** フィルターで絞ったリストの内容を格納（表示するTodos） */
  const [filteredList, setFilteredList] = useRecoilState(filteredListState);
  /** フィルターされたTodoの数 */
  const filteredTodosCount = useRecoilValue(filteredListStateLength);
  /** 編集中todo の idを格納 */
  const [editId, setEditId] = useRecoilState(editIdState);
  /** Todoリスト内の項目数 */
  const todosCount: number = useRecoilValue(todoListStateLength);
  /** フィルターするステータス */
  const [filter, setFilter] = useRecoilState(filterState);
  /** 完了リスト */
  const [completedList, setCompletedList] = useRecoilState(completedListState);
  const boxRef = useRef<HTMLDivElement>(null);

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

  /** 更新ボタン押下時に更新フォームを表示 */
  const showEditForm = useCallback(
    (item: Task) => {
      setEditId(item.id);
      setEditTodo(item);
      //
      const consoleLogId = (e: any) => {
        console.log(e.target);
        document.removeEventListener("click", consoleLogId);
      };
      document.addEventListener("click", (e) => consoleLogId(e));
      // 更新フォームのタイトルにフォーカス
      const inputBox = document.getElementById("editTitle");
      inputBox?.focus();
    },
    [editId]
  );

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

  /** Firebase DBのTodoアイテムを削除 */
  const deleteTodoData = async (item: Task) => {
    try {
      const taskRef = ref(db, "tasks/" + item.id);
      remove(taskRef);
    } catch (error) {
      alert("エラー発生。Todoが削除されませんでした。");
    }
  };

  /** 変数editTodoを初期値に戻す */
  const clearEditTodo = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent> | null) => {
      setEditTodo({
        id: "",
        title: "",
        status: "notStarted",
        details: "",
        deadline: "",
        createdAt: "",
      });
    },
    []
  );

  /** 保存ボタン押下時にリストを更新し、更新フォームを閉じる。 */
  const handleEdit = (e: React.FormEvent<HTMLFormElement>, item: Task) => {
    e.preventDefault();
    updateTodoData(editTodo); // DB更新
    const newList = [...todoList].map((todo) => {
      return todo.id === item.id ? editTodo : todo;
    });
    setTodoList(newList); // 画面更新
    clearEditTodo(null); // editTodoを初期値に戻す
    setEditId("");
  };

  // useEffect(() => {
  //   //対象の要素を取得
  //   const el = boxRef.current;

  //   //対象の要素がなければ何もしない
  //   // if (!el) return;

  //   //クリックした時に実行する関数
  //   const hundleClickOutside = (e: MouseEvent) => {
  //     // console.log(boxRef.current);
  //     console.log("178", e.target);
  //     if (!el?.contains(e.target as Node)) {
  //       //ここに外側をクリックしたときの処理
  //       console.log("hi");
  //     } else {
  //       //ここに内側をクリックしたときの処理
  //       console.log("hi2");
  //     }
  //   };

  //   //クリックイベントを設定
  //   document.addEventListener("click", hundleClickOutside);

  //   //クリーンアップ関数
  //   return () => {
  //     //コンポーネントがアンマウント、再レンダリングされたときにクリックイベントを削除
  //     document.removeEventListener("click", hundleClickOutside);
  //   };
  // }, [boxRef]);

  useLayoutEffect(() => {
    // フォーカス時のイベントリスナー
    const handleFocus = () => {
      console.log("フォーカスされました");
      // ここにフォーカス時の処理を書く
    };

    // ブラー（フォーカスが外れた）時のイベントリスナー
    const handleBlur = () => {
      console.log("フォーカスが外れました");
      // ここにフォーカスが外れた時の処理を書く
    };

    // イベントリスナーを設定
    const boxElement = boxRef.current;
    boxElement?.addEventListener("focus", handleFocus);
    boxElement?.addEventListener("blur", handleBlur);

    // クリーンアップ関数
    return () => {
      boxElement?.removeEventListener("focus", handleFocus);
      boxElement?.removeEventListener("blur", handleBlur);
    };
  }, []);

  /** todoを削除する */
  const handleDelete = useCallback(
    (item: Task) => {
      // 更新フォームが開いていたら閉じる。
      setEditId("");
      clearEditTodo(null);
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
      // 更新フォームが開いていたら閉じる。
      setEditId("");
      clearEditTodo(null);
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
    // 更新フォームが開いていたら閉じる。
    setEditId("");
    clearEditTodo(null);
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
      <Text fontSize="1.6rem" textAlign={["center"]} mb={4}>
        Todoリスト
      </Text>
      <Box>
        {todosCount > 0 && (
          <>
            {/** todoが１件以上ある場合 */}
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
                w="105px"
                name="filter"
                backgroundColor="white"
                borderColor="lightgray"
                borderRadius="5px"
                value={filter}
                onChange={onChangeFilter}
              >
                <option value="all">全て</option>
                <option value="notStarted">未着手</option>
                <option value="inProgress">進行中</option>
              </Select>
              <Button
                h="28px"
                backgroundColor="orange"
                color="white"
                ml="10px"
                px="6px"
                py="2px"
                onClick={handleSort}
              >
                <Text fontSize="0.8rem">並べ替え</Text>
                <Text fontWeight="700">↑</Text>
              </Button>
            </Box>
          </>
        )}
        {filteredTodosCount > 0 ? (
          filteredList.map((item) =>
            item.id === editId ? (
              <Box
                id="editForm"
                key={item.id}
                mt="3px"
                backgroundColor="beige"
                borderRadius="5px"
                border="#347"
                px="2px"
                py="4px"
                ref={boxRef}
              >
                <form
                  onSubmit={(e: React.FormEvent<HTMLFormElement>) =>
                    handleEdit(e, item)
                  }
                >
                  <Box
                    display="flex"
                    justifyContent="start"
                    alignItems="center"
                  >
                    <Input
                      size="sm"
                      type="text"
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
                      name="details"
                      w="238px"
                      backgroundColor="white"
                      borderRadius="5px"
                      onChange={handleOnChange}
                      value={editTodo?.details}
                    />
                    <Select
                      name="status"
                      size="sm"
                      w="102px"
                      h="32px"
                      backgroundColor="white"
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
                      size="sm"
                      ml="1px"
                      w="105px"
                      borderRadius="5px"
                      backgroundColor="white"
                      value={editTodo?.deadline}
                      onChange={handleOnChange}
                    />
                    <Text ml="1px" w="95px">
                      {editTodo?.createdAt}
                    </Text>
                    <Button
                      mr="2px"
                      h="32px"
                      backgroundColor="orange"
                      fontSize="0.8rem"
                      color="white"
                      px="7px"
                      py="2px"
                      type="submit"
                    >
                      保存
                    </Button>
                    <Button
                      type="button"
                      h="32px"
                      backgroundColor="orange"
                      fontSize="0.8rem"
                      color="white"
                      px="4px"
                      py="2px"
                      onClick={() => {
                        clearEditTodo(null);
                        setEditId("");
                      }}
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
                py={0}
              >
                <Text w="240px">{item.title}</Text>
                <Text w="240px">{item.details}</Text>
                <Select
                  name="status"
                  w="110px"
                  h="34px"
                  borderRadius="5px"
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
                <Text w="95px">{item.deadline}</Text>
                <Text w="95px">{item.createdAt}</Text>
                <Button
                  mr="2px"
                  h="28px"
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
                  h="28px"
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
            未完了Todoなし!
          </Text>
        )}
      </Box>
    </Box>
  );
};
