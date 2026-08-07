import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as communityApi from "../../api/communityApi";
import type { CommunityImage } from "../../api/communityApi";

const describeError = (err: any): string =>
  err?.response?.data?.error ||
  err?.response?.data?.msg ||
  err?.message ||
  "알 수 없는 오류";

const CommunityFormComponent = () => {
  const { postNo } = useParams();
  const navigate = useNavigate();
  const isEdit = !!postNo;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<CommunityImage[]>([]);

  useEffect(() => {
    if (!isEdit || !postNo) {
      return;
    }

    communityApi.getOne(Number(postNo)).then((post) => {
      setTitle(post.title);
      setContent(post.content);
      setExistingImages(post.imageList);
    });
  }, [isEdit, postNo]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files ? Array.from(e.target.files) : []);
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
        await communityApi.modify(targetPostNo, { title, content });
      } else {
        const result = await communityApi.register({ title, content });
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
    <form onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold">{isEdit ? "글 수정" : "글쓰기"}</h2>

      <p>제목</p>
      <input value={title} onChange={(e) => setTitle(e.target.value)} required />

      <p>내용</p>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={10}
        required
      />

      {existingImages.length > 0 && (
        <>
          <p>기존 첨부 이미지/영상</p>
          <div className="flex gap-2 flex-wrap mb-2">
            {existingImages.map((img) => (
              <div key={img.fileName} className="relative">
                {img.video ? (
                  <video
                    src={communityApi.getFileUrl(img.fileName)}
                    controls
                    className="h-24"
                  />
                ) : (
                  <img
                    src={communityApi.getFileUrl(img.fileName)}
                    className="h-24"
                  />
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveExistingImage(img.fileName)}
                  className="absolute top-0 right-0 bg-black/60 text-white px-1 text-xs"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <p>이미지/영상 첨부</p>
      <input type="file" accept="image/*,video/*" multiple onChange={handleFileChange} />

      <div className="mt-3">
        <button type="submit">저장</button>
      </div>
    </form>
  );
};

export default CommunityFormComponent;
