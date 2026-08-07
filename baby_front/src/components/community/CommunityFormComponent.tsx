import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as communityApi from "../../api/communityApi";

const CommunityFormComponent = () => {
  const { postNo } = useParams();
  const navigate = useNavigate();
  const isEdit = !!postNo;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!isEdit || !postNo) {
      return;
    }

    communityApi.getOne(Number(postNo)).then((post) => {
      setTitle(post.title);
      setContent(post.content);
    });
  }, [isEdit, postNo]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files ? Array.from(e.target.files) : []);
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
      alert("저장에 실패했습니다.");
      console.error(err);
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

      <p>이미지/영상 첨부</p>
      <input type="file" accept="image/*,video/*" multiple onChange={handleFileChange} />

      <div className="mt-3">
        <button type="submit">저장</button>
      </div>
    </form>
  );
};

export default CommunityFormComponent;
