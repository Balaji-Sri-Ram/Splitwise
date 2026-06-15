import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { Users, Plus, X, Mail, Edit2, Check, Receipt } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupSize, setGroupSize] = useState(0);
  
  // View/Edit Group States
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', description: '', icon: '' });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const socket = useAuthStore((state) => state.socket);
  const navigate = useNavigate();

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data);
    } catch (err) {
      console.error('Failed to fetch groups', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (socket) {
      // Listen for group events globally
      socket.on('new_group', () => {
        fetchGroups();
      });

      // Join rooms for existing groups
      groups.forEach(g => {
        socket.emit('join_group', g.id);
      });

      return () => {
        socket.off('new_group');
      };
    }
  }, [socket, groups.length]);

  const onCreateGroup = async (data) => {
    try {
      // Format emails array correctly, filtering out empty ones
      const memberEmails = data.memberEmails ? data.memberEmails.filter(e => e && e.trim() !== '') : [];
      
      const payload = {
        name: data.name,
        description: data.description,
        icon: data.icon,
        memberEmails
      };

      await api.post('/groups', payload);
      setIsModalOpen(false);
      reset();
      setGroupSize(0);
      fetchGroups();
      fetchGroups();
    } catch (err) {
      console.error('Failed to create group', err);
      alert(err.response?.data?.error || 'Failed to create group. Please check if emails are valid and not already added.');
    }
  };

  const handleViewGroup = (group) => {
    setSelectedGroup(group);
    setEditFormData({ name: group.name, description: group.description, icon: group.icon });
    setIsEditing(false);
    setIsViewModalOpen(true);
  };

  const onUpdateGroup = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/groups/${selectedGroup.id}`, editFormData);
      setIsEditing(false);
      fetchGroups(); // This will also trigger via socket, but we do it immediately for snappy UI
    } catch (err) {
      console.error('Failed to update group', err);
      alert('Failed to update group.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Your Groups</h1>
          <p className="text-graphite mt-1">Manage your shared expenses.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Create Group
        </button>
      </div>

      {loading ? (
        <div className="text-graphite">Loading groups...</div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-soft border border-border-soft p-12 text-center">
          <div className="w-16 h-16 bg-bg-card rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
            <Users size={32} />
          </div>
          <h3 className="text-lg font-medium text-charcoal mb-2">No groups yet</h3>
          <p className="text-graphite mb-6 max-w-sm mx-auto">
            You aren't part of any groups. Create one to start splitting expenses with friends.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-primary hover:text-primary-light font-medium transition-colors"
          >
            + Create your first group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <div key={group.id} className="bg-white rounded-2xl shadow-soft border border-border-soft p-6 hover:shadow-md transition-shadow cursor-pointer flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-bg-card flex items-center justify-center text-xl">
                  {group.icon || '📦'}
                </div>
                <span className="text-xs font-medium text-graphite bg-bg-base px-2 py-1 rounded-md">
                  {group.members.length} members
                </span>
              </div>
              <h3 className="text-lg font-bold text-charcoal mb-1 truncate">{group.name}</h3>
              <p className="text-sm text-graphite line-clamp-2 mb-4 flex-1">
                {group.description || 'No description provided.'}
              </p>
              <div 
                className="pt-4 border-t border-border-soft flex items-center justify-between text-sm font-medium transition-colors"
              >
                <button 
                  onClick={() => handleViewGroup(group)}
                  className="text-primary hover:text-accent"
                >
                  View Group &rarr;
                </button>
                <button 
                  onClick={() => navigate('/expenses', { state: { groupId: group.id } })}
                  className="text-graphite hover:text-charcoal flex items-center gap-1"
                >
                  <Receipt size={16} />
                  Expenses
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-charcoal/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-soft border border-border-soft w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-border-soft flex justify-between items-center">
              <h2 className="text-lg font-bold text-charcoal">Create New Group</h2>
              <button onClick={() => { setIsModalOpen(false); setGroupSize(0); reset(); }} className="text-graphite hover:text-charcoal transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onCreateGroup)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Group Name</label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  type="text"
                  className="w-full px-4 py-2 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-bg-base"
                  placeholder="e.g. Miami Trip"
                />
                {errors.name && <span className="text-xs text-red-500 mt-1">{errors.name.message}</span>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Description (Optional)</label>
                <textarea
                  {...register('description')}
                  className="w-full px-4 py-2 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-bg-base resize-none"
                  placeholder="What is this group for?"
                  rows={3}
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Icon/Emoji (Optional)</label>
                <input
                  {...register('icon')}
                  type="text"
                  className="w-full px-4 py-2 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-bg-base"
                  placeholder="🏖️"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">How many friends are you adding?</label>
                <div className="flex items-center gap-4 bg-bg-base p-1 rounded-lg w-fit border border-border-soft">
                  {[0, 1, 2, 3, 4].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setGroupSize(num)}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                        groupSize === num 
                          ? 'bg-white shadow-sm text-primary border border-border-soft' 
                          : 'text-graphite hover:text-charcoal border border-transparent'
                      }`}
                    >
                      {num === 0 ? 'None' : num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Member Inputs */}
              <div className={`space-y-3 overflow-hidden transition-all duration-300 ease-in-out ${groupSize > 0 ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0'}`}>
                {Array.from({ length: groupSize }).map((_, index) => (
                  <div key={index} className="flex flex-col">
                    <label className="block text-xs font-medium text-graphite mb-1">Friend {index + 1} Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail size={16} className="text-graphite" />
                      </div>
                      <input
                        {...register(`memberEmails.${index}`)}
                        type="email"
                        className="w-full pl-10 pr-4 py-2 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-bg-base text-sm"
                        placeholder={`friend${index + 1}@example.com`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-border-soft">
                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-light text-white font-medium py-2.5 rounded-lg transition-colors"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View/Edit Group Modal */}
      {isViewModalOpen && selectedGroup && (
        <div className="fixed inset-0 bg-charcoal/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-soft border border-border-soft w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-border-soft flex justify-between items-center bg-bg-base/50 shrink-0">
              <h2 className="text-lg font-bold text-charcoal flex items-center gap-2">
                {isEditing ? 'Edit Group' : 'Group Details'}
              </h2>
              <div className="flex gap-2">
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-colors">
                    <Edit2 size={18} />
                  </button>
                )}
                <button onClick={() => setIsViewModalOpen(false)} className="text-graphite hover:text-charcoal transition-colors p-1.5">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="editGroupForm" onSubmit={onUpdateGroup} className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-20">
                    <label className="block text-xs font-medium text-graphite mb-1">Emoji</label>
                    <input
                      value={editFormData.icon || ''}
                      onChange={(e) => setEditFormData({...editFormData, icon: e.target.value})}
                      disabled={!isEditing}
                      className={`w-full px-2 py-2 text-center text-xl border rounded-lg transition-colors ${isEditing ? 'bg-white border-primary focus:ring-2 focus:ring-primary/20' : 'bg-bg-base border-transparent text-charcoal opacity-70'}`}
                      placeholder="📦"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-graphite mb-1">Name</label>
                    <input
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                      disabled={!isEditing}
                      required
                      className={`w-full px-4 py-2 border rounded-lg transition-colors ${isEditing ? 'bg-white border-primary focus:ring-2 focus:ring-primary/20' : 'bg-bg-base border-transparent text-charcoal font-bold opacity-100'}`}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-graphite mb-1">Description</label>
                  <textarea
                    value={editFormData.description || ''}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    disabled={!isEditing}
                    rows={3}
                    className={`w-full px-4 py-2 border rounded-lg transition-colors resize-none ${isEditing ? 'bg-white border-primary focus:ring-2 focus:ring-primary/20' : 'bg-bg-base border-transparent text-charcoal opacity-70'}`}
                    placeholder="No description provided."
                  ></textarea>
                </div>

                <div className="pt-4 border-t border-border-soft">
                  <h4 className="text-sm font-bold text-charcoal mb-3 flex items-center gap-2">
                    <Users size={16} className="text-primary"/> 
                    Members ({selectedGroup.members.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {selectedGroup.members.map(member => (
                      <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg bg-bg-base border border-border-soft">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {member.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium text-charcoal truncate">{member.user.name}</p>
                          <p className="text-xs text-graphite truncate">{member.user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>
            
            {isEditing && (
              <div className="p-4 border-t border-border-soft shrink-0 bg-bg-base/50">
                <button
                  type="submit"
                  form="editGroupForm"
                  className="w-full bg-primary hover:bg-primary-light text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2"
                >
                  <Check size={18} />
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
