import { useRecoilState, useRecoilValue } from "recoil";
import { todoState } from "../states/TodoState";
import { useCallback, useRef, useEffect, useState } from "react";
import { todoListState } from "../states/TodoListState";
import "../styles/AddTodo.module.css";
import { editIdState } from "../states/EditIdState";
import { Task, Status } from "../types/Task";
import { ref, set } from "firebase/database";
import { db } from "../../FirebaseConfig";
import { Box, Text, Input, Button } from "@chakra-ui/react";

/** 追加フォーム表示、追加処理をするコンポーネント */
export const AddTodo = () => {
  /** 追加フォーム入力内容を格納する */
  const [todo, setTodo] = useRecoilState(todoState);
  /** Todoリストを格納 */
  const [todoList, setTodoList] = useRecoilState(todoListState);
  /** 編集中Todoの内容を格納 */
  const editId = useRecoilValue(editIdState);
  /** タイトルのバリデーション表示 */
  const [error, setError] = useState(false);
  /** 追加フォームのタイトル入力欄にrefを設定 */
  const inputRef = useRef<HTMLInputElement>(null);

  /** 初回レンダリング時、追加フォームのタイトルにフォーカス */
  useEffect(() => {
    inputRef?.current.focus();
  }, []);

  /** 追加ボタン押下時にTodoをリストに追加する。 */
  const handleAddTask = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      // タイトルにスペースのみ登録されている場合バリデーションを表示
      setError(todo.title.replace(/\s+/g, "") === "");
      /** 32桁のuuidを生成 */
      const getUUID = () => {
        const digits = "0123456789abcdef";
        const n = digits.length;
        let uuid = "";
        for (let i = 0; i < 32; i++) {
          uuid += digits[Math.floor(Math.random() * n)];
        }
        return uuid;
      };
      // uuid取得
      const id: string = getUUID();
      // 今日の日付を取得してcreatedAtに格納
      const currDate: Date = new Date();
      const createdAt: string = currDate.toISOString().split("T")[0];
      // ステータスを未着手に設定
      const status: Status = "notStarted";
      // 追加するTodoの内容を格納
      const newTodo: Task = {
        ...todo,
        id,
        status,
        createdAt,
      };
      // Firebase DBにtodoを書き込む
      writeTodoData(newTodo);
      // TodoListにtodoを追加
      setTodoList([...todoList, newTodo]);
      // todo Stateを初期値に戻す。追加フォームも初期状態に戻る
      clearTodo(null);
    },
    [todo, todoList]
  );

  /** 入力内容をtodo に格納。画面に反映される。 */
  const handleOnChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const task: Task = { ...todo, [e.target.name]: e.target.value };
      setTodo(task);
    },
    [todo]
  );

  /** 変数todoを初期値に戻す　*/
  const clearTodo = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent> | null) => {
      // バリデーションが表示されていたら非表示にする。
      setError(false);
      setTodo({
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

  /** Firebase DBにTodoを追加 */
  const writeTodoData = async (item: Task) => {
    const taskRef = ref(db, "tasks/" + item.id);
    try {
      await set(taskRef, item);
    } catch (error) {
      alert("エラー発生。データは保存されませんでした。");
    }
  };

  return (
    <Box w="920px" marginTop={10} mx="auto" pt={20}>
      <Box display="flex" justifyContent="center" alignItems="center" mb="30px">
        <Text fontSize="1.2rem" fontWeight="200" mr="6px" mt="2px">
          <i className="fa-regular fa-rectangle-list"></i>
        </Text>
        <Text fontSize="1.8rem" textAlign="center">
          My Todo List
        </Text>
      </Box>
      {/** 追加フォーム */}
      <form className="AddForm" onSubmit={handleAddTask}>
        <Box
          display="flex"
          justifyContent="center"
          gap="1px"
          align-items="center"
        >
          <Box>
            <Input
              size="sm"
              borderRadius="5px"
              borderColor="gray"
              backgroundColor="white"
              w="200px"
              type="text"
              name="title"
              ref={inputRef}
              onChange={handleOnChange}
              value={todo.title}
              placeholder="タイトル"
              required
            />
            {error && (
              <Text fontSize="0.8rem" color="red" marginTop="1px">
                タイトルは必須です。
              </Text>
            )}
          </Box>
          <Input
            type="text"
            name="details"
            size="sm"
            borderRadius="5px"
            borderColor="gray"
            backgroundColor="white"
            w="200px"
            onChange={handleOnChange}
            value={todo.details}
            placeholder="内容"
          />
          <Input
            type="date"
            name="deadline"
            borderColor="gray"
            size="sm"
            borderRadius="5px"
            backgroundColor="white"
            w="130px"
            onChange={handleOnChange}
            value={todo.deadline}
          />
          <Button
            mr="2px"
            h="32px"
            backgroundColor="orange"
            fontSize="0.8rem"
            color="white"
            px="10px"
            py="2px"
            type="submit"
            disabled={!!editId}
          >
            追加
          </Button>
          <Button
            h="32px"
            backgroundColor="orange"
            color="white"
            fontSize="0.8rem"
            px="10px"
            py="2px"
            type="button"
            onClick={clearTodo}
          >
            クリア
          </Button>
        </Box>
      </form>
    </Box>
  );
};
