/*
 * clang -std=c++11 -lstdc++ -pthreads -I /tbb/include/ -L /tbb/build/release/ -ltbb tasks.cpp thread.cpp -o thread
 */

class Threads {
public:
    void join_released_threads();
    void join_all_threads();
    /*
     * Start a new thread with given function f and arguments args.
     * When finished, add the thread's ID to the release_threads queue.
     * Also, from the main thread, push the thread into
     * the threads vector so it can be removed once it's released.
     */
    template <typename F, typename ...Args>
    void start_thread(F&& f, Args&&... args) {
        std::thread t = std::thread([&]{
                f(args...);
                release_thread(std::this_thread::get_id());
            });
        store_thread(move(t));
    }
    ~Threads();
private:
    void release_thread(std::thread::id);
    void store_thread(std::thread);
    void remove_joined_threads();
};



