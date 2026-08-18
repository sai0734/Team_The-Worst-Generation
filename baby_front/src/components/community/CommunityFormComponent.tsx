import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as communityApi from "../../api/communityApi";
import { COMMUNITY_CATEGORIES } from "../../api/communityApi";
import type { CommunityCategory, CommunityImage } from "../../api/communityApi";

const describeError = (err: any): string =>
  err?.response?.data?.error ||
  err?.response?.data?.msg ||
  err?.message ||
  "알 수 없는 오류";

const CommunityFormComponent = () => {
  const { postNo } = useParams();
  const navigate = useNavigate();
  const isEdit = !!postNo;

  const [category, setCategory] = useState<CommunityCategory>("자유");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string; video: boolean }[]>([]);
  const [existingImages, setExistingImages] = useState<CommunityImage[]>([]);

  useEffect(() => {
    if (!isEdit || !postNo) {
      return;
    }

    communityApi.getOne(Number(postNo)).then((post) => {
      setCategory(post.category);
      setTitle(post.title);
      setContent(post.content);
      setExistingImages(post.imageList);
    });
  }, [isEdit, postNo]);

  // 선택한 파일들을 서버 업로드 전에 로컬에서 미리보기용 URL로 변환
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

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files ? Array.from(e.target.files) : []);
  };

  const handleRemoveNewFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = async (fileName: string) => {
    if (!postNo) {
      return;
    }

    if (!confirm("이 이미지를 삭제할까요?")) {
      return;
    }

    try {
      await communityApi.removeImage(Number(postNo), fileName);
      setExistingImages((prev) => prev.filter((img) => img.fileName !== fileName));
    } catch (err) {
      console.error(err);
      alert(`이미지 삭제에 실패했습니다.\n(${describeError(err)})`);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      let targetPostNo: number;

      if (isEdit && postNo) {
        targetPostNo = Number(postNo);
        await communityApi.modify(targetPostNo, { category, title, content });
      } else {
        const result = await communityApi.register({ category, title, content });
        targetPostNo = result.postNo;
      }

      if (files.length > 0) {
        await communityApi.addImages(targetPostNo, files);
      }

      navigate(`/community/${targetPostNo}`);
    } catch (err) {
      console.error(err);
      alert(`저장에 실패했습니다.\n(${describeError(err)})`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="recall-form">
      <h2 className="page-title" style={{ margin: 0 }}>
        {isEdit ? "글 수정" : "글쓰기"}
      </h2>

      <div className="field">
        <label>말머리</label>
        <div className="seg">
          {COMMUNITY_CATEGORIES.map((c) => (
            <button
              type="button"
              key={c}
              className={category === c ? "is-active" : ""}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>제목</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className="field">
        <label>내용</label>
        <textarea
          className="bulk-input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          required
        />
      </div>

      {existingImages.length > 0 && (
        <div className="field">
          <label>기존 첨부 이미지/영상</label>
          <div className="community-media">
            {existingImages.map((img) => (
              <div key={img.fileName} className="community-media-item">
                {img.video ? (
                  <video
                    src={communityApi.getFileUrl(img.fileName)}
                    controls
                    style={{ maxHeight: 120 }}
                  />
                ) : (
                  <img
                    src={communityApi.getFileUrl(img.fileName)}
                    style={{ maxHeight: 120 }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveExistingImage(img.fileName)}
                  className="community-media-remove"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="photo-upload">
        <p>이미지/영상 첨부</p>
        <input type="file" accept="image/*,video/*" multiple onChange={handleFileChange} />

        {previews.length > 0 && (
          <div className="community-media" style={{ marginTop: 12 }}>
            {previews.map((preview, index) => (
              <div key={preview.url} className="community-media-item">
                {preview.video ? (
                  <video src={preview.url} controls style={{ maxHeight: 120 }} />
                ) : (
                  <img src={preview.url} style={{ maxHeight: 120 }} />
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveNewFile(index)}
                  className="community-media-remove"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button type="submit" className="submit-btn">
        저장
      </button>
    </form>
  );
};

export default CommunityFormComponent;
