import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as communityApi from "../../api/communityApi";
import type {
  CommunityComment,
  CommunityPost,
} from "../../api/communityApi";
import useCustomLogin from "../../hooks/useCustomLogin";

const describeError = (err: any): string =>
  err?.response?.data?.error ||
  err?.response?.data?.msg ||
  err?.message ||
  "알 수 없는 오류";

// 본문이 이 길이 미만이면 AI 요약 API 자체를 호출하지 않는다 (짧은 글은 요약할 필요가 없음).
const AI_SUMMARY_MIN_CONTENT_LENGTH = 150;

const CommunityDetailComponent = () => {
  const { postNo } = useParams();
  const navigate = useNavigate();
  const { isLogin, loginState } = useCustomLogin();

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [newComment, setNewComment] = useState("");
  const [newCommentFiles, setNewCommentFiles] = useState<File[]>([]);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [editingCommentNo, setEditingCommentNo] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  const loadPost = async () => {
    if (!postNo) {
      return;
    }
    setPost(await communityApi.getOne(Number(postNo)));
  };

  const loadComments = async () => {
    if (!postNo) {
      return;
    }
    setComments(await communityApi.getComments(Number(postNo)));
  };

  useEffect(() => {
    loadPost();
    loadComments();
    setSummary(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postNo]);

  useEffect(() => {
    if (!post || !postNo) {
      return;
    }

    if (post.content.length < AI_SUMMARY_MIN_CONTENT_LENGTH) {
      return;
    }

    setSummaryLoading(true);

    communityApi
      .getSummary(Number(postNo))
      .then((res) => setSummary(res.summary))
      .catch((err) => console.error(err))
      .finally(() => setSummaryLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.postNo]);

  if (!post || !postNo) {
    return <div>불러오는 중...</div>;
  }

  const isMine = loginState.email === post.writerEmail;

  const handleDeletePost = async () => {
    if (!confirm("게시글을 삭제할까요?")) {
      return;
    }
    try {
      await communityApi.remove(Number(postNo));
      navigate("/community");
    } catch (err) {
      console.error(err);
      alert(`삭제에 실패했습니다.\n(${describeError(err)})`);
    }
  };

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) {
      return;
    }
    try {
      const result = await communityApi.registerComment(Number(postNo), {
        content: newComment,
      });
      if (newCommentFiles.length > 0) {
        await communityApi.addCommentImages(
          Number(postNo),
          result.commentNo,
          newCommentFiles,
        );
      }
      setNewComment("");
      setNewCommentFiles([]);
      await loadComments();
    } catch (err) {
      console.error(err);
      alert(`댓글 등록에 실패했습니다.\n(${describeError(err)})`);
    }
  };

  const handleAddReply = async (parentCommentNo: number) => {
    if (!replyContent.trim()) {
      return;
    }
    try {
      const result = await communityApi.registerComment(Number(postNo), {
        content: replyContent,
        parentCommentNo,
      });
      if (replyFiles.length > 0) {
        await communityApi.addCommentImages(
          Number(postNo),
          result.commentNo,
          replyFiles,
        );
      }
      setReplyContent("");
      setReplyFiles([]);
      setReplyingTo(null);
      await loadComments();
    } catch (err) {
      console.error(err);
      alert(`답글 등록에 실패했습니다.\n(${describeError(err)})`);
    }
  };

  const handleEditComment = async (commentNo: number) => {
    if (!editContent.trim()) {
      return;
    }
    try {
      await communityApi.modifyComment(Number(postNo), commentNo, editContent);
      setEditingCommentNo(null);
      await loadComments();
    } catch (err) {
      console.error(err);
      alert(`댓글 수정에 실패했습니다.\n(${describeError(err)})`);
    }
  };

  const handleDeleteComment = async (commentNo: number) => {
    if (!confirm("댓글을 삭제할까요?")) {
      return;
    }
    try {
      await communityApi.removeComment(Number(postNo), commentNo);
      await loadComments();
    } catch (err) {
      console.error(err);
      alert(`댓글 삭제에 실패했습니다.\n(${describeError(err)})`);
    }
  };

  const topComments = comments.filter((c) => c.parentCommentNo == null);
  const repliesOf = (commentNo: number) =>
    comments.filter((c) => c.parentCommentNo === commentNo);

  const renderComment = (comment: CommunityComment, isReply: boolean) => {
    const isCommentMine = loginState.email === comment.writerEmail;

    return (
      <li
        key={comment.commentNo}
        className={isReply ? "ml-6 border-l pl-3 py-1" : "border-b py-2"}
      >
        {comment.deleted ? (
          <div className="text-gray-400">삭제된 댓글입니다.</div>
        ) : (
          <>
            <div className="font-bold">{comment.nickname}</div>

            {editingCommentNo === comment.commentNo ? (
              <div>
                <input
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
                <button onClick={() => handleEditComment(comment.commentNo)}>
                  저장
                </button>
                <button onClick={() => setEditingCommentNo(null)}>취소</button>
              </div>
            ) : (
              <div>{comment.content}</div>
            )}

            {comment.imageList.length > 0 && (
              <div className="flex gap-2 mt-1">
                {comment.imageList.map((img) =>
                  img.video ? (
                    <video
                      key={img.fileName}
                      src={communityApi.getFileUrl(img.fileName)}
                      controls
                      className="h-20"
                    />
                  ) : (
                    <img
                      key={img.fileName}
                      src={communityApi.getFileUrl(img.fileName)}
                      className="h-20"
                    />
                  ),
                )}
              </div>
            )}

            <div className="flex gap-2 text-sm">
              {isLogin && !isReply && (
                <button
                  onClick={() =>
                    setReplyingTo(
                      replyingTo === comment.commentNo ? null : comment.commentNo,
                    )
                  }
                >
                  답글
                </button>
              )}
              {isCommentMine && editingCommentNo !== comment.commentNo && (
                <>
                  <button
                    onClick={() => {
                      setEditingCommentNo(comment.commentNo);
                      setEditContent(comment.content ?? "");
                    }}
                  >
                    수정
                  </button>
                  <button onClick={() => handleDeleteComment(comment.commentNo)}>
                    삭제
                  </button>
                </>
              )}
            </div>

            {replyingTo === comment.commentNo && (
              <div className="mt-1">
                <input
                  placeholder="답글 작성"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                />
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setReplyFiles(e.target.files ? Array.from(e.target.files) : [])
                  }
                />
                <button onClick={() => handleAddReply(comment.commentNo)}>
                  등록
                </button>
              </div>
            )}
          </>
        )}

        {!isReply && repliesOf(comment.commentNo).length > 0 && (
          <ul>
            {repliesOf(comment.commentNo).map((reply) => renderComment(reply, true))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div>
      <h2 className="text-xl font-bold">{post.title}</h2>
      <div className="text-sm text-gray-500">
        {post.nickname} · 조회 {post.viewCount}
      </div>

      {post.imageList.length > 0 && (
        <div className="flex gap-2 my-2">
          {post.imageList.map((img) =>
            img.video ? (
              <video
                key={img.fileName}
                src={communityApi.getFileUrl(img.fileName)}
                controls
                className="max-h-64"
              />
            ) : (
              <img
                key={img.fileName}
                src={communityApi.getFileUrl(img.fileName)}
                className="max-h-64"
              />
            ),
          )}
        </div>
      )}

      <p className="whitespace-pre-wrap my-3">{post.content}</p>

      {post.content.length >= AI_SUMMARY_MIN_CONTENT_LENGTH && (
        <div className="mb-3">
          {summaryLoading && <p className="italic text-gray-400">AI 요약 생성 중...</p>}
          {!summaryLoading && summary && <p className="italic">AI 한줄요약: {summary}</p>}
        </div>
      )}

      {isMine && (
        <div className="flex gap-2 mb-3">
          <button onClick={() => navigate(`/community/${postNo}/edit`)}>
            수정
          </button>
          <button onClick={handleDeletePost}>삭제</button>
        </div>
      )}

      <button onClick={() => navigate("/community")}>목록으로</button>

      <h3 className="font-bold mt-5">댓글 {post.commentCount}</h3>

      {isLogin && (
        <form onSubmit={handleAddComment} className="flex gap-2 my-2">
          <input
            placeholder="댓글을 입력하세요"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setNewCommentFiles(e.target.files ? Array.from(e.target.files) : [])
            }
          />
          <button type="submit">등록</button>
        </form>
      )}

      <ul>{topComments.map((comment) => renderComment(comment, false))}</ul>
    </div>
  );
};

export default CommunityDetailComponent;
