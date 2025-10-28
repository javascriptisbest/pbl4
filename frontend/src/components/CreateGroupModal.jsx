import { useState } from "react";
import { X, Users, Upload } from "lucide-react";
import { useGroupStore } from "../store/useGroupStore";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

const CreateGroupModal = ({ isOpen, onClose }) => {
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const { createGroup } = useGroupStore();
  const { users } = useChatStore();
  const { authUser } = useAuthStore();

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const toggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }

    if (selectedMembers.length === 0) {
      toast.error("Select at least one member");
      return;
    }

    setIsCreating(true);
    try {
      await createGroup({
        name: groupName,
        description: groupDescription,
        memberIds: selectedMembers,
        avatar: avatarPreview,
      });

      // Reset form
      setGroupName("");
      setGroupDescription("");
      setSelectedMembers([]);
      setAvatarPreview(null);
      onClose();
    } catch {
      // Error handled in store
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-base-100 rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Create Group
          </h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Group Avatar */}
          <div className="flex justify-center">
            <label className="cursor-pointer">
              <div className="w-24 h-24 rounded-full bg-base-200 flex items-center justify-center overflow-hidden border-2 border-base-300 hover:border-primary transition-colors">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Group avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Upload className="w-8 h-8 text-base-content/50" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Group Name */}
          <div>
            <label className="label">
              <span className="label-text">Group Name *</span>
            </label>
            <input
              type="text"
              placeholder="Enter group name"
              className="input input-bordered w-full"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={50}
            />
          </div>

          {/* Group Description */}
          <div>
            <label className="label">
              <span className="label-text">Description (optional)</span>
            </label>
            <textarea
              placeholder="Enter group description"
              className="textarea textarea-bordered w-full"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              rows={3}
              maxLength={200}
            />
          </div>

          {/* Members Selection */}
          <div>
            <label className="label">
              <span className="label-text">
                Add Members * ({selectedMembers.length} selected)
              </span>
            </label>
            <div className="border border-base-300 rounded-lg max-h-60 overflow-y-auto">
              {users
                .filter((user) => user._id !== authUser._id) // Exclude current user
                .map((user) => (
                  <label
                    key={user._id}
                    className="flex items-center gap-3 p-3 hover:bg-base-200 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={selectedMembers.includes(user._id)}
                      onChange={() => toggleMember(user._id)}
                    />
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt={user.fullName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {user.fullName}
                      </div>
                    </div>
                  </label>
                ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost flex-1"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={isCreating}
            >
              {isCreating ? (
                <span className="loading loading-spinner"></span>
              ) : (
                "Create Group"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
