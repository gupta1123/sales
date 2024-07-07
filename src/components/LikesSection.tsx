import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import { useSelector } from 'react-redux';

type Like = {
  id: number;
  key: string;
  value: string;
};

type LikesSectionProps = {
  storeId: string;
};

type RootState = {
  auth: {
    token: string;
  };
};

export default function LikesSection({ storeId }: LikesSectionProps) {
  const [likes, setLikes] = useState<Like[]>([]);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const token = useSelector((state: RootState) => state.auth.token);
  const [newLike, setNewLike] = useState<{ key: string; value: string }>({
    key: "",
    value: "",
  });
  const [editingLikeId, setEditingLikeId] = useState<number | null>(null);

  useEffect(() => {
    fetchLikes();
  }, []);

  const fetchLikes = async () => {
    try {
      const response = await fetch(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/store/getById?id=${storeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      const likesData = data.likes;
      const likesArray: Like[] = Object.entries(likesData).map(([key, value]) => ({
        id: Date.now() + Math.random(),
        key,
        value: value as string, // Assert the type of value as string
      }));
      setLikes(likesArray);
    } catch (error) {
      console.error("Error fetching likes:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewLike({ ...newLike, [e.target.name]: e.target.value });
  };

  const handleAddLike = async () => {
    if (newLike.key.trim() !== "" && newLike.value.trim() !== "") {
      const like: Like = { id: Date.now(), ...newLike };
      const updatedLikes = [...likes, like];

      try {
        const response = await fetch(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/store/edit?id=${storeId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            likes: updatedLikes.reduce((acc, curr) => {
              acc[curr.key] = curr.value;
              return acc;
            }, {} as Record<string, string>),
          }),
        });

        if (response.ok) {
          setLikes(updatedLikes);
          setNewLike({ key: "", value: "" });
          setIsAdding(false);
        } else {
          console.error("Error updating likes:", response.statusText);
        }
      } catch (error) {
        console.error("Error updating likes:", error);
      }
    }
  };

  const handleEditLike = (id: number) => {
    const like = likes.find((like) => like.id === id);
    if (like) {
      setNewLike({ key: like.key, value: like.value });
      setEditingLikeId(id);
      setIsEditing(true);
    }
  };

  const handleUpdateLike = async () => {
    if (newLike.key.trim() !== "" && newLike.value.trim() !== "") {
      const updatedLikes = likes.map((like) => {
        if (like.id === editingLikeId) {
          return { ...like, key: newLike.key, value: newLike.value };
        }
        return like;
      });

      try {
        const response = await fetch(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/store/edit?id=${storeId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            likes: updatedLikes.reduce((acc, curr) => {
              acc[curr.key] = curr.value;
              return acc;
            }, {} as Record<string, string>),
          }),
        });

        if (response.ok) {
          setLikes(updatedLikes);
          setNewLike({ key: "", value: "" });
          setIsEditing(false);
          setEditingLikeId(null);
        } else {
          console.error("Error updating likes:", response.statusText);
        }
      } catch (error) {
        console.error("Error updating likes:", error);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Likes</CardTitle>
      </CardHeader>
      <CardContent>
        {!isAdding && !isEditing && likes.length === 0 && (
          <div className="text-center">
            <p className="text-gray-500">No likes available.</p>
            <Button onClick={() => setIsAdding(true)} className="mt-4">
              <Plus className="mr-2" /> Add Like
            </Button>
          </div>
        )}
        {(isAdding || isEditing) && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Key</Label>
                <Input
                  name="key"
                  value={newLike.key}
                  onChange={handleInputChange}
                  placeholder="Enter key"
                />
              </div>
              <div>
                <Label>Value</Label>
                <Input
                  name="value"
                  value={newLike.value}
                  onChange={handleInputChange}
                  placeholder="Enter value"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                onClick={isEditing ? handleUpdateLike : handleAddLike}
                variant="default"
              >
                {isEditing ? "Update" : "Add"}
              </Button>
              <Button
                onClick={() => {
                  setIsAdding(false);
                  setIsEditing(false);
                  setEditingLikeId(null);
                  setNewLike({ key: "", value: "" });
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </>
        )}
        {likes.length > 0 && (
          <>
            <div className="mt-8">
              <div className="flex flex-wrap gap-2">
                {likes.map((like) => (
                  <div
                    key={like.id}
                    className="flex items-center bg-gray-100 rounded-full px-3 py-1"
                  >
                    <span className="text-gray-800 font-medium">
                      {like.key}:
                    </span>
                    <span className="text-gray-600 ml-1">{like.value}</span>
                    <Button
                      onClick={() => handleEditLike(like.id)}
                      variant="ghost"
                      size="sm"
                      className="ml-2"
                    >
                      <Edit className="text-blue-500" size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            {!isAdding && !isEditing && (
              <Button onClick={() => setIsAdding(true)} className="mt-4">
                <Plus className="mr-2" /> Add Like
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}