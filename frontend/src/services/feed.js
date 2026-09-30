import { 
    get, 
    post, 
    postMultipart, 
    feedApi, 
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



    // RETURNS THE BASE URL USED FOR RESOLVING MULTIMEDIA ASSETS
    static get mediaBaseUrl() {
        return mediaBase;
    }




    // FETCHES ALL POSTS FOR THE MAIN FEED
    static async getFeed(cursor = null) {
        const params = {};
        if (cursor) params.cursor = cursor;
        return get(feedApi, params);
    }




    // RETRIEVES THE DETAILS OF A SPECIFIC FEED POST BY ITS ID
    static async getPost(id) {
        return get(feedPostByIdApi(id));
    }




    // CREATES A NEW TEXT-BASED POST ON THE FEED
    static async createPost(data) {
        return post(feedApi, data);
    }




    // UPLOADS A MULTIMEDIA FILE AND CREATES A POST ON THE FEED
    static async createPostWithFile(formData) {
        return postMultipart(feedUploadApi, formData);
    }




    // DELETES A SPECIFIC POST FROM THE FEED
    static async deletePost(id) {
        return del(feedPostByIdApi(id));
    }




    // ADDS A COMMENT OR REPLY TO A POST
    static async addComment(postId, content, parentId = null) {
        return post(feedPostCommentsApi(postId), { content, parentId });
    }




    // FETCHES ALL COMMENTS FOR A GIVEN POST
    static async getComments(postId) {
        return get(feedPostCommentsApi(postId));
    }




    // DELETES A SPECIFIC COMMENT
    static async deleteComment(commentId) {
        return del(feedCommentDeleteApi(commentId));
    }




    // ADDS A LIKE TO A SPECIFIC COMMENT
    static async likeComment(commentId) {
        return post(feedCommentLikesApi(commentId));
    }




    // REMOVES A LIKE FROM A SPECIFIC COMMENT
    static async unlikeComment(commentId) {
        return del(feedCommentLikesApi(commentId));
    }




    // ADDS A LIKE TO A SPECIFIC POST
    static async likePost(postId) {
        return post(feedPostLikesApi(postId));
    }




    // REMOVES A LIKE FROM A SPECIFIC POST
    static async unlikePost(postId) {
        return del(feedPostLikesApi(postId));
    }




    // REGISTERS A VIEW EVENT FOR A SPECIFIC POST
    static async addView(postId) {
        return post(feedPostViewsApi(postId));
    }




    // REGISTERS A SHARE EVENT FOR A SPECIFIC POST
    static async addShare(postId) {
        return post(feedPostSharesApi(postId));
    }
}
