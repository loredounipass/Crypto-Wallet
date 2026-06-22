import { 
    get, 
    post, 
    postMultipart, 
    feedApi, 
    feedVideosApi, 
    feedUploadApi, 
    feedPostByIdApi, 
    feedPostCommentsApi, 
    feedCommentLikesApi, 
    feedPostLikesApi, 
    feedPostViewsApi, 
    feedPostSharesApi, 
    feedCommentDeleteApi,
    del,
    mediaBase
} from '../api/http';

export default class FeedService {
    static get mediaBaseUrl() {
        return mediaBase;
    }

    static async getFeed() {
        return get(feedApi);
    }

    static async getVideoFeed() {
        return get(feedVideosApi);
    }

    static async getPost(id) {
        return get(feedPostByIdApi(id));
    }

    static async createPost(data) {
        return post(feedApi, data);
    }

    static async createPostWithFile(formData) {
        return postMultipart(feedUploadApi, formData);
    }

    static async deletePost(id) {
        return del(feedPostByIdApi(id));
    }

    static async addComment(postId, content, parentId = null) {
        return post(feedPostCommentsApi(postId), { content, parentId });
    }

    static async getComments(postId) {
        return get(feedPostCommentsApi(postId));
    }

    static async deleteComment(commentId) {
        return del(feedCommentDeleteApi(commentId));
    }

    static async likeComment(commentId) {
        return post(feedCommentLikesApi(commentId));
    }

    static async unlikeComment(commentId) {
        return del(feedCommentLikesApi(commentId));
    }

    static async likePost(postId) {
        return post(feedPostLikesApi(postId));
    }

    static async unlikePost(postId) {
        return del(feedPostLikesApi(postId));
    }

    static async addView(postId) {
        return post(feedPostViewsApi(postId));
    }

    static async addShare(postId) {
        return post(feedPostSharesApi(postId));
    }
}
