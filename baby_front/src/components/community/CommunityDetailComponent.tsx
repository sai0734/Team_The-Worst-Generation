import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as communityApi from "../../api/communityApi";
import { CATEGORY_BADGE_CLASS } from "../../api/communityApi";
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

const formatDateTime = (iso: string): string => iso.slice(0, 16).replace("T", " ");

// 댓글/답글에 첨부한 파일을 서버 업로드 전에 로컬에서 미리보기로 보여준다.
const AttachmentPreview = ({
  files,
  onRemove,
}: {
  files: File[];
  onRemove: (index: number) => void;
}) => {
  const [previews, setPreviews] = useState<{ url: string; video: boolean }[]>([]);

  useEffect(() => {
    const next = files.map((file) => ({
      url: URL.createObjectURL(file),
      video: file.type.startsWith("video/"),
    }));
    setPreviews(next);
    return () => {
      next.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [files]);

  if (previews.length === 0) {
    return null;
  }

  return (
    <div className="community-media" style={{ marginTop: 4 }}>
      {previews.map((preview, index) => (
        <div key={preview.url} className="community-media-item">
          {preview.video ? (
            <video src={preview.url} controls style={{ maxHeight: 70 }} />
          ) : (
            <img src={preview.url} style={{ maxHeight: 70 }} />
          )}
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="community-media-remove"
          >
            삭제
          </button>
        </div>
      ))}
    </div>
  );
};

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

  const handleToggleLike = async () => {
    if (!isLogin || !post) {
      return;
    }
    try {
      const { liked } = await communityApi.toggleLike(Number(postNo));
      setPost({
        ...post,
        liked,
        likeCount: post.likeCount + (liked ? 1 : -1),
      });
    } catch (err) {
      console.error(err);
      alert(`처리에 실패했습니다.\n(${describeError(err)})`);
    }
  };

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
        className={`community-comment${isReply ? " reply" : ""}${comment.deleted ? " deleted" : ""}`}
      >
        {comment.deleted ? (
          <div>삭제된 댓글입니다.</div>
        ) : (
          <>
            <div className="nickname">{comment.nickname}</div>

            {editingCommentNo === comment.commentNo ? (
              <div className="community-reply-form">
                <input
                  type="text"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
                <button
                  type="button"
                  className="btn"
                  onClick={() => handleEditComment(comment.commentNo)}
                >
                  저장
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setEditingCommentNo(null)}
                >
                  취소
                </button>
              </div>
            ) : (
              <div className="content">{comment.content}</div>
            )}

            {comment.imageList.length > 0 && (
              <div className="community-media">
                {comment.imageList.map((img) =>
                  img.video ? (
                    <video
                      key={img.fileName}
                      src={communityApi.getFileUrl(img.fileName)}
                      controls
                      style={{ maxHeight: 100 }}
                    />
                  ) : (
                    <img
                      key={img.fileName}
                      src={communityApi.getFileUrl(img.fileName)}
                      style={{ maxHeight: 100 }}
                    />
                  ),
                )}
              </div>
            )}

            <div className="comment-actions">
              {isLogin && !isReply && (
                <button
                  type="button"
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
                    type="button"
                    onClick={() => {
                      setEditingCommentNo(comment.commentNo);
                      setEditContent(comment.content ?? "");
                    }}
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteComment(comment.commentNo)}
                  >
                    삭제
                  </button>
                </>
              )}
            </div>

            {replyingTo === comment.commentNo && (
              <div>
                <div className="community-reply-form">
                  <input
                    type="text"
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
                  <button
                    type="button"
                    className="btn"
                    onClick={() => handleAddReply(comment.commentNo)}
                  >
                    등록
                  </button>
                </div>
                <AttachmentPreview
                  files={replyFiles}
                  onRemove={(index) =>
                    setReplyFiles((prev) => prev.filter((_, i) => i !== index))
                  }
                />
              </div>
            )}
          </>
        )}

        {!isReply && repliesOf(comment.commentNo).length > 0 && (
          <ul className="community-comment-list" style={{ marginTop: 8 }}>
            {repliesOf(comment.commentNo).map((reply) => renderComment(reply, true))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div>
      <button
        type="button"
        className="btn ghost"
        style={{ marginBottom: 14 }}
        onClick={() => navigate("/community")}
      >
        ← 목록으로
      </button>

      <span
        className={`community-badge ${CATEGORY_BADGE_CLASS[post.category]}`}
        style={{ marginBottom: 6, display: "inline-flex" }}
      >
        {post.category}
      </span>
      <h2 className="community-detail-title">{post.title}</h2>
      <div className="community-detail-meta">
        {post.nickname} · {formatDateTime(post.regTime)} · 조회 {post.viewCount}
      </div>

      <div className="community-actions">
        <button
          type="button"
          className={`btn ghost${post.liked ? " is-active" : ""}`}
          onClick={handleToggleLike}
          disabled={!isLogin}
        >
          👍 공감 {post.likeCount}
        </button>
      </div>

      {post.imageList.length > 0 && (
        <div className="community-media">
          {post.imageList.map((img) =>
            img.video ? (
              <video
                key={img.fileName}
                src={communityApi.getFileUrl(img.fileName)}
                controls
              />
            ) : (
              <img
                key={img.fileName}
                src={communityApi.getFileUrl(img.fileName)}
              />
            ),
          )}
        </div>
      )}

      <p className="community-content">{post.content}</p>

      {post.content.length >= AI_SUMMARY_MIN_CONTENT_LENGTH && (
        <div className="community-summary">
          {summaryLoading && <p>AI 요약 생성 중...</p>}
          {!summaryLoading && summary && <p>AI 한줄요약: {summary}</p>}
        </div>
      )}

      {isMine && (
        <div className="community-actions">
          <button
            type="button"
            className="btn ghost"
            onClick={() => navigate(`/community/${postNo}/edit`)}
          >
            수정
          </button>
          <button type="button" className="btn ghost" onClick={handleDeletePost}>
            삭제
          </button>
        </div>
      )}

      <div className="card community-comment-section">
        <h3>댓글 {post.commentCount}</h3>

        {isLogin && (
          <div>
            <form onSubmit={handleAddComment} className="community-comment-form">
              <input
                type="text"
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
              <button type="submit" className="btn">
                등록
              </button>
            </form>
            <AttachmentPreview
              files={newCommentFiles}
              onRemove={(index) =>
                setNewCommentFiles((prev) => prev.filter((_, i) => i !== index))
              }
            />
          </div>
        )}

        <ul className="community-comment-list">
          {topComments.map((comment) => renderComment(comment, false))}
        </ul>
      </div>
    </div>
  );
};

export default CommunityDetailComponent;
