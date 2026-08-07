import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as communityApi from "../../api/communityApi";
import type {
  CommunityComment,
  CommunityPost,
} from "../../api/communityApi";
import useCustomLogin from "../../hooks/useCustomLogin";

const CommunityDetailComponent = () => {
  const { postNo } = useParams();
  const navigate = useNavigate();
  const { isLogin, loginState } = useCustomLogin();

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postNo]);

  if (!post || !postNo) {
    return <div>불러오는 중...</div>;
  }

  const isMine = loginState.email === post.writerEmail;

  const handleSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await communityApi.getSummary(Number(postNo));
      setSummary(res.summary);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm("게시글을 삭제할까요?")) {
      return;
    }
    await communityApi.remove(Number(postNo));
    navigate("/community");
  };

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) {
      return;
    }
    await communityApi.registerComment(Number(postNo), { content: newComment });
    setNewComment("");
    await loadComments();
  };

  const handleAddReply = async (parentCommentNo: number) => {
    if (!replyContent.trim()) {
      return;
    }
    await communityApi.registerComment(Number(postNo), {
      content: replyContent,
      parentCommentNo,
    });
    setReplyContent("");
    setReplyingTo(null);
    await loadComments();
  };

  const handleEditComment = async (commentNo: number) => {
    if (!editContent.trim()) {
      return;
    }
    await communityApi.modifyComment(Number(postNo), commentNo, editContent);
    setEditingCommentNo(null);
    await loadComments();
  };

  const handleDeleteComment = async (commentNo: number) => {
    if (!confirm("댓글을 삭제할까요?")) {
      return;
    }
    await communityApi.removeComment(Number(postNo), commentNo);
    await loadComments();
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

      <div className="mb-3">
        <button onClick={handleSummary} disabled={summaryLoading}>
          {summaryLoading ? "요약 중..." : "AI 한줄요약"}
        </button>
        {summary && <p className="italic mt-1">{summary}</p>}
      </div>

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
          <button type="submit">등록</button>
        </form>
      )}

      <ul>{topComments.map((comment) => renderComment(comment, false))}</ul>
    </div>
  );
};

export default CommunityDetailComponent;
