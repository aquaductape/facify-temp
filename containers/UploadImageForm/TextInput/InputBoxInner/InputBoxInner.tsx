import debounce from "lodash/debounce";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import MiniImage from "../../../../components/MiniImage";
import ArrowToRight from "../../../../components/svg/ArrowToRight";
import { Android, IOS } from "../../../../lib/onFocusOut/browserInfo";
import store from "../../../../store/store";
import { doesImageExist } from "../../../../utils/doesImageExist";
import { addUrlItem, removeUrlItem, TURLItem } from "../../formSlice";
import Input from "./Input";
import UtilBar from "./UtilBar";
import { checkDebouncedUrls, splitValueIntoUrlItems } from "./utils";

let keyDownProps: { key: string; paste: boolean } = {
  key: "",
  paste: false,
};

type TInputBoxInner = {
  isOpenRef: React.MutableRefObject<boolean>;
  displayErrorRef: React.MutableRefObject<boolean>;
  contentElRef: React.MutableRefObject<HTMLDivElement | null>;
  containerElRef: React.MutableRefObject<HTMLDivElement | null>;
};
const InputBoxInner = ({
  isOpenRef,
  displayErrorRef,
  containerElRef,
  contentElRef,
}: TInputBoxInner) => {
  const dispatch = useDispatch();

  // const [value, setValue] = useState("");
  const hasSubmitRef = useRef(false);
  const [imgUrl, setImgUrl] = useState("");
  const [imgError, setImgError] = useState(false);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();

    onInputUrls(e);

    if (hasSubmitRef.current) {
      onInputCheckUrlDebouncedRef.current.cancel();
      hasSubmitRef.current = false;
      return;
    }

    onInputCheckUrlDebouncedRef.current(value);
  };

  const onInputCheckUrlDebouncedRef = useRef(
    debounce(
      async (value: string) => {
        // when there's multiple URLs present (from using Ctrl-a or Backspacing), currently there's no support to detect which URL is invalid
        // Therefore input string will not be validated
        if (!value || value.match(/\s/g)) {
          value = "";
          setImgError(false);
          setImgUrl(value);
          return;
        }

        const success = await doesImageExist(value);
        setImgError(!success);
        setImgUrl(value);
      },
      500,
      { leading: true }
    )
  );

  const onImgError = () => {
    setImgError(true);
  };

  const mobileScrollDown = (inputUrlItems: TURLItem[]) => {
    if (!(Android || IOS)) return;

    const { scrollY } = window;
    const maxItems = 3;
    const itemHeight = 55;
    const maxScrollY = itemHeight * 2;
    const urlItems = store.getState().form.urlItems;

    // android has issues focusing aligned to input, so I wont use this func for now
    const scrollDownIfNearTop = () => {
      if (scrollY > maxScrollY) return;
      window.scrollTo({ top: maxScrollY - itemHeight });
    };

    if (urlItems.length > 2) {
      // scrollDownIfNearTop();
      return;
    }

    const total =
      inputUrlItems.length + urlItems.length > maxItems
        ? 0
        : inputUrlItems.length + urlItems.length;

    if (!total) {
      // scrollDownIfNearTop();
      return;
    }

    if (scrollY > maxScrollY) return;

    window.scrollTo({ top: scrollY + itemHeight * total });
  };

  const onInputUrls = (e: ChangeEvent<HTMLInputElement>) => {
    const { key, paste } = keyDownProps;
    const value = e.target.value.trim();

    if (!value) return;

    if (paste || (key === " " && value)) {
      const urlItems = splitValueIntoUrlItems({
        value,
      });

      console.log({ urlItems });

      hasSubmitRef.current = true;
      e.target.value = "";
      setImgUrl("");
      setImgError(false);

      mobileScrollDown(urlItems);

      dispatch(addUrlItem(urlItems));

      // a chance submission occurs during debounce, therefore a valid url will still
      // be marked as invalid, which will have a stuck invalid tag. This line covers that basis
      checkDebouncedUrls(dispatch, urlItems);
      return;
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const caretPosition = target.selectionStart;
    const value = target.value.trim();
    const vpressed = /v/i.test(e.key);
    const paste =
      (vpressed && e.ctrlKey) ||
      (vpressed && e.metaKey) ||
      /insert/i.test(e.key);
    const selectAll = /a/.test(e.key) && e.ctrlKey;

    keyDownProps = { key: e.key, paste };

    if (e.key.match(/backspace/i) && caretPosition === 0) {
      const urlItems = store.getState().form.urlItems;
      const lastItem = urlItems[urlItems.length - 1];

      if (!lastItem) return;
      e.preventDefault();
      e.stopPropagation();

      const content = lastItem.content;
      target.value = content + (value ? " " + value : "");
      target.setSelectionRange(content.length, content.length);
      target.blur();
      target.focus();
      dispatch(removeUrlItem({ type: "pop" }));
      setImgUrl("");
      setImgError(false);
      return;
    }

    if (selectAll) {
      const urlItems = store.getState().form.urlItems;
      const reducedContent = urlItems.reduce(
        (acc, curr, idx) => acc + (idx ? " " : "") + curr.content,
        ""
      );

      if (!reducedContent) return;

      target.value = reducedContent + (value ? " " + value : "");
      target.setSelectionRange(0, target.value.length);

      dispatch(removeUrlItem({ type: "all" }));

      return;
    }
  };

  const onKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // @ts-ignore
  };

  const onInput = (e: React.FormEvent<HTMLInputElement>) => {
    // fire order: 1. keydown 2. oninput 3. onChange 4. keyup
    const { key } = keyDownProps;
    const keyIsUnidentified = !!key.match(/unidentified/i) || key === undefined;

    if (keyIsUnidentified) {
      // @ts-ignore
      keyDownProps.key = e.nativeEvent.data as string;
    }

    // @ts-ignore
    if (e.nativeEvent.inputType === "insertFromPaste") {
      keyDownProps.paste = true;
    }
  };

  useEffect(() => {
    if (isOpenRef.current && !imgError) return;

    setImgUrl("");
    setImgError(false);
  }, []);

  return (
    <div className={`input-box-inner ${isOpenRef.current ? "active" : ""}`}>
      <div className="utilbar-container">
        <UtilBar imgError={imgError} isOpenRef={isOpenRef}></UtilBar>
      </div>
      <div className="result">
        {imgUrl && !imgError ? (
          <MiniImage
            url={imgUrl}
            error={imgError}
            onError={() => {}}
            maxWidth={25}
            margin={"0"}
          ></MiniImage>
        ) : (
          <div id="input-arrow" className="arrow">
            <ArrowToRight></ArrowToRight>
          </div>
        )}
      </div>
      <Input
        onChange={onChange}
        onInput={onInput}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        isOpenRef={isOpenRef}
        displayErrorRef={displayErrorRef}
        containerElRef={containerElRef}
        contentElRef={contentElRef}
        imgError={imgError}
        setImgUrl={setImgUrl}
      ></Input>
      <style jsx>
        {`
          .input-box-inner {
            height: 100%;
            pointer-events: none;
          }

          .utilbar-container {
            display: none;
          }

          .result {
            display: none;
            position: absolute;
            left: 5px;
            width: 35px;
            height: 35px;
            padding-left: 10px;
            bottom: 5px;
            background: #fff;
          }

          .arrow {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
            color: #000;
          }

          .input-box-inner.active .result {
            display: flex;
            align-items: center;
            z-index: 5;
          }

          .input-box-inner.active .utilbar-container {
            display: block;
          }
        `}
      </style>
    </div>
  );
};

export default InputBoxInner;
