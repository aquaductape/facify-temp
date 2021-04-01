import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import MiniImage from "../../../../components/MiniImage";
import CloseBtn from "../../../../components/svg/CloseBtn";
import { RootState } from "../../../../store/rootReducer";
import smoothScrollTo from "../../../../utils/smoothScrollTo";
import { removeUrlItem, setUrlItemError } from "../../formSlice";
import ScrollShadow from "./ScrollShadow";
import Sentinel from "./Sentinel";

type TURLTagProps = TURLTag & {
  onRemove: (id: string) => void;
  onError: (id: string) => void;
  parent: React.MutableRefObject<HTMLUListElement | null>;
  willScrollTo: boolean;
};
const URLTags = ({
  id,
  content,
  error,
  name,
  parent,
  willScrollTo,
  onError,
  onRemove,
}: TURLTagProps) => {
  // const displayURL = content.replace(/(https:\/\/|http:\/\/)/g, "");
  const displayURL = error ? content : name;

  useEffect(() => {
    if (!willScrollTo) return;
    setTimeout(() => {
      smoothScrollTo({
        destination: parent.current!.scrollHeight,
        container: parent.current!,
        duration: 500,
      });
    }, 150);
  }, []);

  return (
    <li
      // data-id-url-item={id}
      className={`url-item ${error ? "error" : ""}`}
    >
      <MiniImage
        error={error}
        onError={() => {
          if (error) return;
          onError(id);
        }}
        url={content}
        isUrlTag={true}
        margin={"0"}
        maxHeight={100}
        maxWidth={100}
      ></MiniImage>
      <div className="content">{displayURL}</div>
      <div
        className="url-item__close-btn"
        role="button"
        aria-label="remove url tag"
        onClick={() => {
          // e.preventDefault();
          // e.stopPropagation();
          onRemove(id);
        }}
      >
        <CloseBtn></CloseBtn>
      </div>
      <style jsx>
        {`
          .url-item {
            display: flex;
            align-items: center;
            flex: 1 0 auto;
            background: #cedaff;
            color: #002f9d;
            height: 45px;
            padding: 8px;
            margin: 0 10px;
            margin-top: 10px;
            list-style-type: none;
            font-size: 15px;
          }

          .url-tag-enter {
            opacity: 0;
            height: 0;
            padding: 0;
            margin: 0;
          }

          .url-tag-enter-done {
            height: 45px;
            padding: 8px;
            margin: 0 10px;
            margin-top: 10px;
          }

          .url-tag-enter-active {
            opacity: 1;
            height: 45px;
            padding: 8px;
            margin: 0 10px;
            margin-top: 10px;
            transition: all 100ms linear, opacity 50ms 50ms linear;
          }

          .url-tag-exit {
            opacity: 1;
            height: 45px;
            padding: 8px;
            margin: 0 10px;
            margin-top: 10px;
          }

          .url-tag-exit-active {
            opacity: 0;
            height: 0;
            padding: 0;
            margin: 0;
            transition: all 100ms linear, opacity 50ms linear;
          }

          .url-item__close-btn {
            flex-shrink: 0;
            position: relative;
            left: 8px;
            display: flex;
            align-items: center;
            width: 40px;
            padding: 12px;
            height: 45px;
            margin: 0;
            margin-left: auto;
            color: inherit;
            background: inherit;
            cursor: pointer;
            user-select: none;
            transition: background-color 250ms, color 250ms;
          }

          .url-item__close-btn:hover {
            background: #6f8bdc;
            color: #fff;
          }

          .content {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .url-item.error {
            background: #ffcece;
            color: #550000;
          }

          .url-item.error .url-item__close-btn:hover {
            background: #dc6f6f;
            color: #fff;
          }

          @media (min-width: 500px) {
            .url-item {
              font-size: 18px;
            }
          }
        `}
      </style>
    </li>
  );
};

type TURLTag = { id: string; content: string; name: string; error: boolean };

const TagsArea = () => {
  const dispatch = useDispatch();

  const urls = useSelector((state: RootState) => state.form.urlItems);
  // https://i.imgur.com/nt0RgAH.jpg https://upload.wikimedia.org/wikipedia/commons/8/85/Elon_Musk_Royal_Society_%28crop1%29.jpg https://static.tvtropes.org/pmwiki/pub/images/aubrey_plaza.jpg

  const urlsElRef = useRef<HTMLUListElement | null>(null);
  const scrollShadowElsRef = useRef<{
    top: { current: HTMLDivElement | null };
    bottom: { current: HTMLDivElement | null };
  }>({
    top: { current: null },
    bottom: { current: null },
  });

  const onRemoveUrlList = (id: string) => {
    dispatch(removeUrlItem({ id }));
  };

  const onError = (id: string) => {
    dispatch(setUrlItemError({ id, error: true }));
  };

  return (
    <div className="main">
      <div className="bar">
        <div
          className="close-btn"
          role="button"
          aria-label="collapse input box"
        >
          <CloseBtn></CloseBtn>
        </div>
        <div className="title">
          <div className="title-sub-1"> To paste multiple URLs, </div>{" "}
          <span className="title-sub-2">separate by Space</span>
        </div>
      </div>
      <div className="urls-container">
        {urls.length > 2 ? (
          <>
            <ScrollShadow
              top={true}
              scrollShadowElsRef={scrollShadowElsRef}
            ></ScrollShadow>
            <ScrollShadow
              top={false}
              scrollShadowElsRef={scrollShadowElsRef}
            ></ScrollShadow>
          </>
        ) : null}
        <ul ref={urlsElRef} className="urls">
          <TransitionGroup component={null}>
            {urls.map(({ id, content, name, error }, idx, self) => {
              const willScrollTo = self.length > 2 && idx === self.length - 1;

              return (
                <CSSTransition classNames="url-tag" timeout={100} key={id}>
                  <URLTags
                    id={id}
                    content={content}
                    name={name}
                    error={error}
                    parent={urlsElRef}
                    onError={onError}
                    onRemove={onRemoveUrlList}
                    willScrollTo={willScrollTo}
                  ></URLTags>
                </CSSTransition>
              );
            })}
          </TransitionGroup>
          {urls.length > 2 ? (
            <>
              <Sentinel
                top={true}
                scrollShadowElsRef={scrollShadowElsRef}
              ></Sentinel>
              <Sentinel
                top={false}
                scrollShadowElsRef={scrollShadowElsRef}
              ></Sentinel>
            </>
          ) : null}
        </ul>
      </div>
      <style jsx>{`
        .main {
          position: relative;
          background: #fff;
          height: 100%;
        }

        .urls-container {
          position: relative;
          padding-bottom: 50px;
        }

        .urls {
          position: relative;
          max-height: 150px;
          overflow: hidden;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          padding: 0;
          margin: 0;
        }

        .bar {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          height: 40px;
          background: #ececec;
          transition: height 100ms linear;
        }

        .close-btn {
          flex-shrink: 0;
          display: flex;
          align-item: center;
          width: 40px;
          padding: 10px;
          background: #ececec;
          cursor: pointer;
          user-select: none;
          transition: background-color 250ms, color 250ms;
        }

        .close-btn:hover {
          background: #102466;
          color: #fff;
        }

        .title {
          width: 50%;
          font-size: 10px;
        }
        .title-sub-1,
        .title-sub-2 {
          display: inline-block;
          white-space: nowrap;
        }

        @media (min-width: 320px) {
          .title {
            font-size: 13px;
          }
        }

        @media (min-width: 360px) {
          .title {
            font-size: 15px;
          }
        }

        @media (min-width: 375px) {
          .title {
            font-size: 16px;
          }
        }

        @media (min-width: 500px) {
          .title {
            font-size: 17px;
            width: 55%;
          }
        }
        @media (min-width: 800px) {
          .title {
            font-size: 20px;
            width: 60%;
          }
        }
        @media (min-width: 800px) {
          .title {
            margin-left: 20px;
          }
        }
      `}</style>
      {/* dynamic */}
      <style jsx>
        {`
          .urls-container {
            padding-bottom: ${urls.length ? "70px" : "50px"};
          }
        `}
      </style>
    </div>
  );
};

export default TagsArea;
