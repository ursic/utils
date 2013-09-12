/*
 * g++/clang++ -std=c++11 -lstdc++ -pthreads -I /tbb/include/ -L /tbb/build/release/ -ltbb tasks.cpp thread.cpp -o thread
 */

/******************************************
 * http://stackoverflow.com/a/10766422/5090
 */
// implementation details, users never invoke these directly
namespace detail
{
    template <typename F, typename Tuple, bool Done, int Total, int... N>
    struct call_impl
    {
        static void call(F f, Tuple && t)
        {
            call_impl<F, Tuple, Total == 1 + sizeof...(N), Total, N..., sizeof...(N)>::call(f, std::forward<Tuple>(t));
        }
    };

    template <typename F, typename Tuple, int Total, int... N>
    struct call_impl<F, Tuple, true, Total, N...>
    {
        static void call(F f, Tuple && t)
        {
            f(std::get<N>(std::forward<Tuple>(t))...);
        }
    };
}
// user invokes this
template <typename F, typename Tuple>
void call(F&& f, Tuple && t)
{
    typedef typename std::decay<Tuple>::type ttype;
    detail::call_impl<F, Tuple, 0 == std::tuple_size<ttype>::value, std::tuple_size<ttype>::value>::call(f, std::forward<Tuple>(t));
}
/******************************************/

void release_thread(std::thread::id);

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
        auto f_t   = std::make_tuple(f);
        auto arg_t = std::make_tuple(args...);
        std::thread t = std::thread([=] {
                call(std::get<0>(f_t), arg_t);
                release_thread(std::this_thread::get_id());
            });
        store_thread(move(t));
    }
    ~Threads();
private:
    void store_thread(std::thread);
    void remove_joined_threads();
};
